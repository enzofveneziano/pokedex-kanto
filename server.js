const http=require('http'),fs=require('fs'),path=require('path'),https=require('https');
if(fs.existsSync(path.join(__dirname,'.env'))){
  fs.readFileSync(path.join(__dirname,'.env'),'utf8').split('\n').forEach(line=>{
    const[k,...v]=line.split('=');
    if(k&&v.length)process.env[k.trim()]=v.join('=').trim();
  });
}
const PORT=process.env.PORT||3000;
const API_KEY=process.env.GROQ_API_KEY||'';
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.ico':'image/x-icon'};

const server=http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}

  if(req.method==='POST'&&req.url==='/api/chat'){
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',()=>{
      if(!API_KEY){
        res.writeHead(500,{'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:'GROQ_API_KEY não configurada no .env'}));
      }
      let payload;
      try{payload=JSON.parse(body);}
      catch{res.writeHead(400,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'JSON inválido'}));}

      const messages=[
        {role:'system',content:payload.system||''},
        ...(payload.messages||[]).map(m=>({role:m.role==='ai'?'assistant':m.role,content:m.content}))
      ];

      const postData=JSON.stringify({
        model:'openai/gpt-oss-20b',
        messages,
        max_tokens:1024,
        temperature:0.7
      });

      const options={
        hostname:'api.groq.com',
        path:'/openai/v1/chat/completions',
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${API_KEY}`,
          'Content-Length':Buffer.byteLength(postData)
        }
      };

      const apiReq=https.request(options,apiRes=>{
        let data='';
        apiRes.on('data',c=>data+=c);
        apiRes.on('end',()=>{
          try{
            const json=JSON.parse(data);
            if(json.error){
              res.writeHead(400,{'Content-Type':'application/json'});
              return res.end(JSON.stringify({error:json.error.message}));
            }
            const text=json.choices?.[0]?.message?.content||'Sem resposta.';
            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify({content:[{type:'text',text}]}));
          }catch(e){
            res.writeHead(500,{'Content-Type':'application/json'});
            res.end(JSON.stringify({error:'Erro ao processar resposta'}));
          }
        });
      });

      apiReq.on('error',err=>{
        res.writeHead(500,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error:err.message}));
      });
      apiReq.write(postData);
      apiReq.end();
    });
    return;
  }

  const filePath=path.join(__dirname,'public',req.url==='/'?'index.html':req.url);
  fs.readFile(filePath,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('404 — Não encontrado');}
    const ext=path.extname(filePath);
    res.writeHead(200,{'Content-Type':MIME[ext]||'text/plain'});
    res.end(data);
  });
});

server.listen(PORT,()=>{
  console.log(`\n🎮 Pokédex rodando em http://localhost:${PORT}`);
  if(!API_KEY){
    console.warn('⚠️  GROQ_API_KEY não encontrada!');
  }else{
    console.log('✅  Groq API configurada — IA pronta!\n');
  }
});
