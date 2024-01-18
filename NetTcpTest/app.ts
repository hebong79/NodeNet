//const net = require('net');
import { Console } from 'console';
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
class PacketData2 {
  id : number;
  kor : number;
  mat : number;
  constructor( id:number=0, kor:number = 0, mat:number = 0 ){
    this.id = id;
    this.kor = kor;
    this.mat = mat;
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
    ReceiveData( buf );
    client.write(buf);
    //console.log(`Buffer : ${JSON.stringify(buf)}, Len = ${buf.length}`);
    //client.write(data);
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

function ReceiveData( data : Buffer) {

  let jData = data.toJSON();
  if( jData.type != "Buffer" ) return;

  console.log('jData = ', jData);

  let id = data.readIntLE(0, 4);
  console.log('id = ', id);
  switch( id ){
     case 10:
      Receive_Packet1( data );
      break;
     case 20:
      Receive_Packet2( data );
      break;
  }
}

interface PacketA {
  id : number;
  name : string;
}

function Receive_Packet1( data : Buffer){
 
  console.log('length = ', data.length);

  let index : number = 0;
  let id = data.readIntLE(index, 4);
  
  const nameBuf = Buffer.alloc(data.length-4);
  data.copy(nameBuf, 0, 4, data.length);

  console.log('nameBuf : ', JSON.stringify(nameBuf));
  let name = nameBuf.toString('utf-8');
  console.log('name = ', name);

  let pdata = new PacketData(id, name);

}

function Receive_Packet2( data : Buffer){
  console.log('length = ', data.length);

  let index : number = 0;
  let id = data.readIntLE(index, 4); index +=4;
  let kor = data.readIntLE(index, 4); index +=4;
  let mat = data.readIntLE(index, 4); index +=4;

  let pdata = new PacketData2(id, kor, mat);
   console.log("id = %d, %d, %d", id, kor, mat);


}
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`TCP 서버가 포트 ${PORT}에서 실행 중입니다.`);
});