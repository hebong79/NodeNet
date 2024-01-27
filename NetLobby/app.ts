//"use strict"
// 채팅방 구현예제
// https://velog.io/@uoayop/Node.js-Socket.io-%EC%B1%84%ED%8C%85%EB%B0%A9-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0-1
//외부 아이피 확인방법
// 1. cmd 창에서  curl ifconfig.me 또는 curl ipinfo.io
// 2. 크롬에서 "What is my IP"로 검색

import * as net from 'net';
import { Buffer } from 'node:buffer';

// import express from 'express';
// import http from 'http';
// import { Server, Socket } from 'socket.io';
// import * as socketIO from 'socket.io';

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//             pingTimeout : 10000,    // 핑 연결이 실패후 30초 후 연결 해제한다.
//             //pingInterval: 5000     // 20초 간격으로 핑을 보낸다.
//           });

import { Lobby } from './src/Lobby';
import * as Packets from './src/PacketDatas';

const HEADER_SIZE = 5; // PID(2), ID(2), SIZE(2), CHECKSUM(1)

const mLobby = new Lobby(); // 로비
const mClients: net.Socket[] = []; // 클라이언트(소캣)리스트
//const _PID:number = 0x7e21;          // 프리픽스 ID 값 : ~, !

// 로비에서 처리할 일 1
// - 계정생성
// - 로그인
// - 로그아웃
// - 계정탈퇴

// 로비에서 처리할 일 2
// - 그룹(방) 생성
// - 그룹(방) 조인
// - 로비의 그룹(방) 리스트

// 그룹(방)에서 처리할 일
// - 그룹(방) 멤버 조인
// - 그룹(방) 멤버 Leave (퇴장)
// - 그룹(방) 초기 멤버 리스트
// - 그룹(방) Ready
// - 그룹(방) 게임시작
// - 그룹(방) 파괴

// io.use((socket:Socket, next) => {
//   if (socket.handshake.query.token === "UNITY") {
//       next();
//   } else {
//       next(new Error("Authentication error"));
//   }
// });

Init_UserData();

const server = net.createServer((client: net.Socket) => {
  console.log('클라이언트가 연결되었습니다.');
  console.log('   local = %s:%s', client.localAddress, client.localPort);
  console.log('   remote = %s:%s', client.remoteAddress, client.remotePort);

  const addr = client.address();
  console.log(`클라이언트가 연결되었습니다. 주소: ${JSON.stringify(addr)}`);

  mClients.push(client);

  // 클라이언트로부터 데이터를 수신하는 이벤트 핸들러
  client.on('data', (data: Buffer) => {
    ReceiveData(data);
  });

  // 5초 간격으로 핑 보내기
  let intervalID = setInterval(() => {
    client.write('ping');
  }, 5000); // 5초

  // 클라이언트 연결이 종료되었을 때의 이벤트 핸들러
  client.on('end', () => {
    console.log('클라이언트와의 연결이 종료되었습니다.');

    // Remove client from socket array
    let index = mClients.indexOf(client);
    if (index != -1) mClients.splice(index, 1);

    client.end();
    client.destroy();
  });

  // 소켓 에러 처리
  client.on('error', (err: Error) => {
    console.log('Socket Error: ', JSON.stringify(err));
    console.log('Socket Error: ', err);
    client.end();
    client.destroy();
  });

  // 클라이언트에게 데이터를 브로드캐스트
  function Broadcast(data: Buffer) {
    server.getConnections((err, count) => {
      console.log(`현재 연결된 클라이언트 수: ${count}`);
    });

    mClients.forEach((client1) => {
      if (client !== client1 && client1.writable) {
        client1.write(data);
      }
    });
  }

  // 데이터 리시브
  function ReceiveData(data: Buffer) {
    //let jData = data.toJSON();
    //console.log('jData = ', jData);

    let idx = 0;
    let pid = data.readIntLE(idx, 2);
    idx += 2;
    let id = data.readIntLE(idx, 2);
    idx += 2;
    let size = data.readIntLE(idx, 2);
    idx += 2;

    // PID 검사
    if (pid != Packets._PID) {
      console.log('Wrong Packet... PID = ', pid);
      return;
    }

    // 패킷 사이즈 검사 및 체크섬 검사를 하면 좀더 안정정이다.
    console.log('id = %d, length = %d', id, data.length);
    switch (id) {
      case Packets.EPacket.Req_createId:
        mLobby.Receive_CreateId(client, data);
        break;
      case Packets.EPacket.Req_login:
        mLobby.Receive_Login(client, data);
        break;
      case Packets.EPacket.Req_logout:
        mLobby.Receive_Logout(client, data);
        break;
      case Packets.EPacket.Req_userInfo:
        mLobby.Receive_UserInfo(client, data);
        break;
      case Packets.EPacket.Req_withdraw:
        mLobby.Receive_Withdraw(client, data);
        break;
      case Packets.EPacket.Req_init_roomlist:
        mLobby.Receive_InitRoomList(client, data);
        break;
      case Packets.EPacket.Req_create_room:
        mLobby.Receive_CreateRoom(client, data);
        break;
      case Packets.EPacket.Req_join_room:
        mLobby.Receive_JoinRoom(client, data);
        break;
      case Packets.EPacket.Req_leave_room:
        mLobby.Receive_LeaveRoom(client, data);
        break;
      case Packets.EPacket.Req_room_ready:
        mLobby.Receive_RoomReady(client, data);
        break;
      case Packets.EPacket.Req_room_chat:
        mLobby.Receive_RoomChat(client, data);
        break;
      case Packets.EPacket.Req_game_start:
        mLobby.Receive_GameStart(client, data);
        break;
      case Packets.EPacket.Req_game_end:
        mLobby.Receive_GameEnd(client, data);
        break;
      case Packets.EPacket.Req_disconnect:
        mLobby.Receive_Disconnect(client, data);
        break;
    }
  }
});

mLobby.mServer = server;
mLobby.mClients = mClients;

// 클라이언트에게 데이터를 브로드캐스트
export function Broadcast(client: net.Socket, data: Buffer) {
  server.getConnections((err, count) => {
    console.log(`현재 연결된 클라이언트 수: ${count}`);
  });

  mClients.forEach((client1) => {
    if (client !== client1 && client1.writable) {
      client1.write(data);
    }
  });
}

const port = process.env.PORT || 19000;
server.listen(port, () => {
  console.log(`서버 가동 (Port) - ${port}`);
});

//export default server;

// io.on('connection', async (socket: Socket) => {
//   //content
//   const req = socket.request;
//   const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//   console.log(
//     `<connection> 클라이언트 접속, socket id = ${socket.id},  ip = ${ip}`
//   );

//   // 5초 간격으로 핑 보내기
//   let intervalID = setInterval(() => {
//     socket.emit('ping');
//   }, 5000); // 5초

//   // 계정 생성 응답-------------------------
//   socket.on('req_create_id', (id: string, pass: string) => {
//     mLobby.Ack_CreateId(socket, id, pass);
//   });

//   // Login 응답 -------------------------
//   socket.on('req_login', (id: string, pass: string) => {
//     mLobby.Ack_Login(socket, id, pass);
//   });

//   // 유저정보 받아서 다른유저에게 브로드캐스팅하기 ----
//   socket.on('req_user_info', (data: string) => {
//     mLobby.Ack_LobyUserInfo(socket, data);
//   });

//   // logout 응답 -------------------------
//   socket.on('req_logout', (id) => {
//     clearInterval(intervalID);
//     mLobby.Ack_Logout(socket, id);
//   });

//   // 가입 탈퇴 응답 -------------------------
//   socket.on('req_withdraw', (id) => {
//     mLobby.Ack_Withdraw(socket, id);
//   });

//   // 가입 탈퇴 응답 -------------------------
//   socket.on('req_lobby_chat', (id, msg) => {
//     mLobby.Ack_LobbyChat(socket, id, msg);
//   });

//   // 로그인 성공시 룸리스트가 요청된다.--------
//   socket.on('req_init_roomlist', (userId) => {
//     mLobby.Ack_InitRoomList(socket, userId);
//   });

//   // 룸 생성 응답 -------------------------
//   socket.on('req_create_room', (roomName, userId) => {
//     mLobby.Ack_CreateRoom(socket, roomName, userId);
//   });

//   socket.on('req_join_room', (roomName: string, userId: string) => {
//     mLobby.Ack_JoinRoom(socket, roomName, userId);
//   });

//   // 룰 나가기 응답 -------------------------
//   socket.on('req_leave_room', (roomName: string, userId: string) => {
//     mLobby.Ack_LeaveRoom(socket, roomName, userId);
//   });

//   socket.on(
//     'req_room_ready',
//     (roomName: string, userId: string, userState: number) => {
//       mLobby.Ack_RoomUserReady(socket, roomName, userId, userState);
//     }
//   );

//   socket.on(
//     'req_room_chat',
//     (roomName: string, userId: string, msg: string) => {
//       mLobby.Ack_RoomChat(socket, roomName, userId, msg);
//     }
//   );

//   // 방장이 Game start 눌렀을때 응답 ----------
//   socket.on('req_game_start', (roomName: string, userId: string) => {
//     mLobby.Ack_GameStart(socket, roomName, userId);
//   });

//   // Game 종료 응답 (방의 모든 유저가 죽었을 때 ) ----------
//   socket.on('req_game_end', (roomName: string, userId: string) => {
//     mLobby.Ack_GameEnd(socket, roomName, userId);
//   });

//   // 필요없음... 서버에서 클라이언트로 ping을 엔진에서 보낸다.
//   //  socket.on('ping', (time)=>{
//   //     console.log(`.. : ${time}`);
//   //  });

//   // 연결 종료 시 -------------------------
//   socket.on('disconnect', async () => {
//     clearInterval(intervalID);
//     mLobby.Ack_Disconnect(socket);
//   });
// });

// 유저 데이타 초기화 하기 ( 가입유저 파일에서 열기 ) -----------
function Init_UserData() {
  mLobby.Init_UserData();
}

// const port =  process.env.PORT || 19000;
// server.listen(port, ()=>{
//     console.log(`서버 가동 (Port) - ${port}`);
// });

// const port =  19000;
// const externalIP = "0.0.0.0";
// server.listen(port, externalIP, ()=>{
//     console.log(`서버 가동 (IP/Port) - ${externalIP} : ${port}`);
// });
