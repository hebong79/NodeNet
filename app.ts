//const net = require('net');
import * as net from 'net';
import { Buffer } from 'node:buffer';


class PacketData {
  id : number;
  name : string;
  constructor( id:number=0, name:string="" ){
    this.id = id;
    this.name = name;
  }
}

//@ts-check
const server = net.createServer((client:net.Socket) => {
  console.log('클라이언트가 연결되었습니다.');
  console.log('   local = %s:%s', client.localAddress, client.localPort);
  console.log('   remote = %s:%s', client.remoteAddress, client.remotePort);
    
  const addr = client.address();
  console.log(`클라이언트가 연결되었습니다. 주소: ${JSON.stringify(addr)}`);

  // 클라이언트로부터 데이터를 수신하는 이벤트 핸들러
  client.on('data', (data) => {
    //socket.write(JSON.stringify(data));
    //console.log(`클라이언트로부터 수신된 데이터: ${data}`);
    const buf = Buffer.from(data);

    let pdata = new PacketData();
    
    console.log(`Buffer : ${JSON.stringify(buf)}, Len = ${buf.length}`);
    console.log(`클라이언트로부터 수신된 데이터: ${JSON.stringify(data)}`);
    client.write(data);
  });

  // 클라이언트 연결이 종료되었을 때의 이벤트 핸들러
  client.on('end', () => {
    console.log('클라이언트와의 연결이 종료되었습니다.');
  });

  client.on('error', (err:Error) => {
    console.log('Socket Error: ', JSON.stringify(err));
    console.log('Socket Error: ', err);
    client.end();
    client.destroy();
    //closePing();
      
    });

});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`TCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
});