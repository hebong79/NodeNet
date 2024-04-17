//const UserInfo = require('./UserInfo');
//const Room = require('./Room');
//const RoomPlayer = require('./RoomPlayer')
//const UserStorage = require('./UserStorage');

//import * as socketIO from 'socket.io';
//import { Socket } from "socket.io";
import net from 'net';
import { Buffer } from 'node:buffer';
import { Socket } from 'net';
import UserInfo from './UserInfo';
import Room from './Room';
import { UserStorage } from './UserStorage';
import RoomPlayer from './RoomPlayer';
import * as PacketDatas from './PacketDatas';
import {
  ECreateId,
  ERoomState,
  EUserState,
  EPacket,
  SORoom,
  SOUser,
  SORoomPlayer,
} from './PacketDatas';

const storage = new UserStorage(); // 저장 리스트 정보

const DLOGIN_SUCCESS = 0; // 로그인 성공
const DLOGIN_NOT_ID = 1; // 존재하지 않는 ID
const DLOGIN_WRONG_PASS = 2; // 패스워드 다름
const DLOGIN_ALREADY_LOGIN = 3; // 이미 로그인중이다.

//룸 상태
export const ERoomstate = {
  Ready: 0, // 대기상태 ( 입장가능 )
  Game: 1, // 게임상태 ( 입장불가 )
};

export const enum EJoinResult {
  Success = 0,
  Fail_Room = 1, // 룸없음
  Fail_Gamming = 2, // 게임중
  Fail_MaxPlayer = 3, // 최대플레이어 초과
  Fail_SamePlayer = 4, // 유저이름이 같은 유저가 접속함
}

// Dictionary 타입 정의
export interface IDictionary<T> {
  [key: string]: T;
}

//
//   로비
//
export class Lobby {
  lobbyUserList: IDictionary<SOUser>;
  roomList: IDictionary<SORoom>;
  mClients: net.Socket[] = [];
  mServer?: net.Server = undefined;

  constructor() {
    this.lobbyUserList = {}; // dictioary로 사용, 로비에 접속된 전체 유저 리스트
    this.roomList = {}; // 룸리스트
  }

  // 유저 데이타 초기화 하기 ( 가입유저 파일에서 열기 ) -----------
  Init_UserData() {
    storage.LoadFile();
  }

  // 클라이언트에게 데이터를 브로드캐스트
  Broadcast(client: net.Socket, data: Buffer) {
    if (this.mServer != undefined) {
      this.mServer.getConnections((err, count) => {
        console.log(`현재 연결된 클라이언트 수: ${count}`);
      });
    }
    this.mClients.forEach((socket) => {
      if (client !== socket && socket.writable) {
        socket.write(data);
      }
    });
  }
  // 클라이언트에게 데이터를 브로드캐스트
  BroadcastInRoom(
    client: net.Socket,
    data: Buffer,
    roomName: string,
    isAll: boolean = false
  ) {
    const kRoom = this.roomList[roomName];
    if (kRoom != undefined) {
      kRoom.players.forEach((kPlayer) => {
        const socket = kPlayer.GetSocket();
        if (socket != undefined) {
          if (isAll == true || client !== socket) {
            socket.write(data);
          }
        }
      });
    }
  }

  //계정생성 처리
  Receive_CreateId(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqCreateId();
    kData.ReceiveData(data);

    //유저정보 추가
    storage.PushData(kData.userId, kData.pass);
    // 파일 저장
    storage.SaveFile();
    console.log('<create_id>\n', storage);

    const resUser = storage.FindUserData(kData.userId);
    let nSuccess = ECreateId.Success;
    //존재하면 실패처리
    if (resUser != undefined) {
      nSuccess = ECreateId.Fail;
    }
    // 결과 전송
    let kAck = new PacketDatas.SAckCreateId(kData.userId, nSuccess);
    let kPacket = kAck.SendData();
    client.write(kPacket);
  }
  // 로그인 처리
  Receive_Login(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqLogin();
    kData.ReceiveData(data);

    //조건체크
    const nRes = this.CheckLogin(kData.userId, kData.pass);
    if (nRes == 0)
      console.log(`<login> Login Success ★ ★ ,  ( id : ${kData.userId} ) `);
    else console.log(`<login> Login Failed ☎ ☎,  code : ${nRes}`);

    // 성공여부 클라이언트에 전송
    let ackLogin = new PacketDatas.SAckLogin(kData.userId, nRes);
    let pakcket = ackLogin.SendData();
    client.write(pakcket);
  }

  // 로그아웃 응답( 유저에게 정보를 전달하지 않음. )
  Receive_Logout(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqLogout();
    kData.ReceiveData(data);

    console.log('로그아웃', kData.userId);
    //clearInterval( socket.interval );
    //목록에서 삭제
    this.LogoutUser(client, kData.userId);
  }

  // 유저정보 응답 (클라이언트에서 로그인 성공하면 호출해야 됨)----------------
  Receive_UserInfo(client: net.Socket, data: Buffer) {
    const kData = new PacketDatas.SReqUserInfo();
    kData.ReceiveData(data);

    // 유저가 존재하는지 체크
    if (kData.user.userId in this.lobbyUserList) return;

    let info = kData.user;
    // dataPoat, movePort가 겹치면 +2씩 계속 증가시키기( while문 이용 )
    const list = Object.values(this.lobbyUserList);
    list.sort((a, b) => a.dataPort - b.dataPort);
    for (var user of list) {
      if (user.ip == info.ip || user.publicIp == info.publicIp) {
        if (user.dataPort == info.dataPort) info.dataPort += 1;
        if (user.movePort == info.movePort) info.movePort += 1;
      }
    }

    // 새로운 유저정보 등록
    //const newUser = new UserInfo(info.userId, info.ip, info.publicIp, info.dataPort, info.movePort);
    let kUser = new SOUser(
      info.userId,
      info.ip,
      info.publicIp,
      info.dataPort,
      info.movePort
    );
    kUser.socket = client;
    this.lobbyUserList[info.userId] = kUser;
    console.log(
      `lobbyUserList count = ${Object.keys(this.lobbyUserList).length}\n`
    );
  }
  // 탈퇴 하기 응답
  Receive_Withdraw(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqWithdraw();
    kData.ReceiveData(data);
    if (storage.RemoveUserData(kData.userId) == true) {
      storage.SaveFile();
    }
    this.LogoutUser(client, kData.userId);
  }
  // 초기 룸리스트 응답
  Receive_InitRoomList(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqInitRoomList();
    kData.ReceiveData(data);

    console.log('room list count = ', Object.keys(this.roomList).length);
    let kNotiData = new PacketDatas.SAckInitRoomList(this.roomList);
    let packet = kNotiData.SendData();
    client.write(packet);
    // const packet = {"datas" : Object.values(this.roomList)};
    // socket.emit('ack_init_roomlist', packet);
  }
  // 룸생성 응답
  Receive_CreateRoom(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqCreateRoom();
    kData.ReceiveData(data);

    if (!(kData.userId in this.lobbyUserList)) {
      console.log(
        'create_room.. ',
        `로비에 없는 유저이다. id = ${kData.userId}`
      );
      return;
    }
    let roomName = kData.roomName;
    let userId = kData.userId;

    const room = new SORoom(roomName, userId, 4);
    const user = this.lobbyUserList[userId];
    room.Initialize(user);

    this.roomList[roomName] = room;
    console.log('create_room.. ', this.roomList[roomName]);

    //Ack create room
    let kAckData = new PacketDatas.SAckCreateRoom(0, room);
    let packet = kAckData.SendData();
    client.write(packet);

    //Notify
    this.SendUpdateRoomList(client);
  }

  // 룸가입(들어가기) 응답
  Receive_JoinRoom(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqJoinRoom();
    kData.ReceiveData(data);

    let roomName = kData.roomName;
    let userId = kData.userId;

    //1. 룸이 없어 조인 실패 ( fail code : 1 )
    if (!(roomName in this.roomList)) {
      console.log('join_room.. ', `없는 Room이다. name = ${roomName}`);
      const room = new SORoom(roomName, userId);
      let kAckData = new PacketDatas.SAckJoinRoom(1, room); // 조인 실패 : 1
      let packet = kAckData.SendData();
      client.write(packet);
      //socket.emit("ack_join_room", {"success":1, "room":room});   // 조인 실패
      return;
    }

    const kRoom = this.roomList[roomName];

    //2. 게임중이면 접속불가 통지하기 ( fail code : 2 )
    if (kRoom.roomState == ERoomstate.Game) {
      let kAckData = new PacketDatas.SAckJoinRoom(2, kRoom);
      let packet = kAckData.SendData();
      client.write(packet);
      // const packet = {"success": 2, "room":kRoom};
      // socket.emit("ack_join_room", packet);
      return;
    }

    //3. 최대 플레이어 체크하기 ( fail code : 3 )
    if (kRoom.players.length >= kRoom.maxPlayer) {
      let kAckData = new PacketDatas.SAckJoinRoom(3, kRoom);
      let packet = kAckData.SendData();
      client.write(packet);

      // const packet = {"success": 3, "room":kRoom};
      //   socket.emit("ack_join_room", packet);
      return;
    }
    //4. 같은유저 접속 체크 ( fail code : 4 )
    let kSamePlayer = kRoom.players.find((e) => e.Name() == userId);
    if (kSamePlayer != undefined) {
      let kAckData = new PacketDatas.SAckJoinRoom(4, kRoom);
      let packet = kAckData.SendData();
      client.write(packet);
      // const packet = {"success": 4, "room":kRoom};
      // socket.emit("ack_join_room", packet);
      return;
    }

    // 조인성공 ------------------------
    // a. 룸에 플레이어 추가
    kRoom.removedFromList = false;
    const kUserInfo = this.lobbyUserList[userId];
    const kPlayer = kRoom.AddPlayer(kUserInfo);

    // b. client에게 룸정보 보내기
    let kAckData = new PacketDatas.SAckJoinRoom(0, kRoom);
    let packet = kAckData.SendData();
    client.write(packet);

    // c. 기존 입장되어있는 유저들에게 방입장 통지하기
    let kNotiData = new PacketDatas.SNotifyEnterRoom(kPlayer);
    let notiPacket = kNotiData.SendData();
    this.BroadcastInRoom(client, notiPacket, roomName);

    // d. 로비유저에게 룸리스트 갱신
    this.SendUpdateRoomList(client);
  }
  // 룸에서 Ready 응답
  Receive_RoomUserReady(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqRoomUserReady();
    kData.ReceiveData(data);

    let roomName = kData.roomName;
    let userId = kData.userId;
    let userState = kData.userState;

    const kRoom = this.roomList[roomName];
    const kPlayer = kRoom.FindPlayer(userId);
    if (kPlayer != undefined) kPlayer.userState = userState;

    console.log(userId, 'State : ', userState);

    //브로드 캐스트 room ready
    let kNotiData = new PacketDatas.SNotifyRoomUserReady(
      roomName,
      userId,
      userState
    );
    let packet: Buffer = kNotiData.SendData();
    this.BroadcastInRoom(client, packet, roomName);
    //socket.broadcast.to(roomName).emit('notify_room_ready', {"id": userId,"userState":userState} );
  }

  //룸 떠나기 응답
  Receive_LeaveRoom(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqLeaveRoom();
    kData.ReceiveData(data);

    let userId = kData.userId;
    let roomName = kData.roomName;

    let kNotiData = new PacketDatas.SNotifyLeaveRoom(roomName, userId);
    let notiPacket: Buffer = kNotiData.SendData();
    this.BroadcastInRoom(client, notiPacket, roomName);
    //socket.broadcast.to(roomName).emit('notify_leave_room', {"id": userId} );
    //socket.leave(roomName);
    //룸에서 유저 제거
    const kRoom: SORoom = this.roomList[roomName];
    kRoom.RemovePlayer(userId);

    console.log('Leave room user id = ', userId);
    console.log('room player count = ', kRoom.PlayerCount());

    //로비에 있는 유저들에게 알림
    if (kRoom.PlayerCount() == 0) {
      kRoom.removedFromList = true;
      let kNotiRoomList = new PacketDatas.SNotifyUpdateRoomList(this.roomList);
      let packet2 = kNotiRoomList.SendData();
      this.Broadcast(client, packet2);
      //await socket.broadcast.emit('notify_update_roomlist', {'datas': Object.values(this.roomList)});
      delete this.roomList[roomName];
    } else {
      //마스터가 방을 나가면 방장 인계
      if (kRoom.masterClientId == userId) {
        let kPlayer = kRoom.FirstPlayer() as RoomPlayer;
        if (kPlayer == undefined) return;

        kRoom.masterClientId = kPlayer.Name();
        kPlayer.isMaster = true;
        console.log('master id = ', kPlayer.Name());

        let kNCMaster = new PacketDatas.SNotifyChangeMaster(roomName, userId);
        let packet3 = kNCMaster.SendData();
        this.BroadcastInRoom(client, packet3, roomName);
        // const changePacket = {"masterId": kPlayer.Name()};
        // await socket.broadcast.to(roomName).emit('notify_room_change_master', changePacket );
      }
      this.SendUpdateRoomList(client);
    }
  }

  // 룽 채팅 응답
  Receive_RoomChat(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqRoomChat();
    kData.ReceiveData(data);

    let userId = kData.userId;
    let msg = kData.msg;
    let roomName = kData.roomName;

    console.log('룸 채팅요청', userId, msg);

    //요청에 대한 응답 보내기
    const kAckData = new PacketDatas.SAckRoomChat(roomName, userId, msg);
    let packet = kAckData.SendData();
    client.write(packet);

    // chat msg를 본인을 제외한 모든유저에게 보낸다.
    const kNotiData = new PacketDatas.SNotifyRoomChat(roomName, userId, msg);
    let packet2 = kNotiData.SendData();
    this.BroadcastInRoom(client, packet2, roomName);
  }
  // 게임 시작 응답
  Receive_GameStart(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqGameStart();
    kData.ReceiveData(data);
    let roomName = kData.roomName;
    let userId = kData.userId;

    console.log('게임시작', '룸 : ', roomName);
    const room = this.roomList[roomName];
    room.roomState = ERoomstate.Game;
    if (room.masterClientId == userId) {
      const kNotiData = new PacketDatas.SNotifyGameStart(true);
      let packet = kNotiData.SendData();
      this.BroadcastInRoom(client, packet, roomName);
      //socket.broadcast.to(roomName).emit('notify_game_start', {"start": true} );  // 나를 제외한 룸의 모든유저에게 보냄
    }
    this.SendUpdateRoomList(client);
  }

  // 게임 종료 응답
  Receive_GameEnd(client: net.Socket, data: Buffer) {
    let kData = new PacketDatas.SReqGameEnd();
    kData.ReceiveData(data);
    let roomName = kData.roomName;
    let userId = kData.userId;

    console.log('게임종료', '룸 : ', roomName);
    const room = this.roomList[roomName];
    room.roomState = ERoomstate.Ready;
    if (room.masterClientId == userId) {
      const kNotiData = new PacketDatas.SNotifyGameEnd(true);
      let packet = kNotiData.SendData();
      this.BroadcastInRoom(client, packet, roomName);
      //socket.broadcast.to(roomName).emit('notify_game_End', {"end": true} );  // 나를 제외한 룸의 모든유저에게 보냄
    }
    this.SendUpdateRoomList(client);
  }

  // 서버연결 끊기 응답
  Receive_Disconnect(client: net.Socket, data: Buffer) {
    const kData = new PacketDatas.SReqDisconnect();
    kData.ReceiveData(data);
    const userId = kData.userId;
    //유저가 룸에 속해있으면 룸에서 삭제
    if (userId != undefined) {
      var kRoom = this.FindRoomByUserId(userId); // 유저가 속해있는 룸 검색
      if (kRoom != undefined) {
        kRoom.RemovePlayer(userId); // 룸에서 유저 삭제
        kRoom.SendLeaveRoomPlayer(client, userId); // 룸 유저 삭제 - 모든유저에게 전송
        if (kRoom.PlayerCount() == 0) {
          kRoom.removedFromList = true;
          this.SendUpdateRoomList(client);
          delete this.roomList[kRoom.Name()];
        } else {
          this.SendUpdateRoomList(client); //로비유저의 룸리스트 정보 갱신
        }
      }
    }
    this.LogoutUser(client, userId);
    //console.log('user count =', Object.keys(this.lobbyUserList).length);
  }

  // 로그인 체크하기 --------------------------------
  CheckLogin(id: string, pass: string): number {
    const findUser = storage.FindUserData(id);

    // 존재하지 않은 id
    if (findUser == undefined) return DLOGIN_NOT_ID;
    // 패스워드 다름
    if (findUser.pass != pass) return DLOGIN_WRONG_PASS;
    // 이미 로그인 중이다.
    if (findUser.id in this.lobbyUserList) return DLOGIN_ALREADY_LOGIN;

    // 성공
    return DLOGIN_SUCCESS;
  }
  // 유저id로 유저 찾기
  FindUser(userId: string): UserInfo | undefined {
    if (userId in this.lobbyUserList) return this.lobbyUserList[userId];

    return undefined;
  }

  // 룸안에 있는 유저의 룸 찾기
  FindRoomByUserId(userId: string): Room | undefined {
    for (var key in this.roomList) {
      var kRoom = this.roomList[key];
      var kPlayer = kRoom.FindPlayer(userId);
      if (kPlayer != undefined) return kRoom;
    }
    return undefined;
  }
  // 로그아웃 후 처리 ( param : 유저 id ) ----------------
  LogoutUser(client: net.Socket, id: string) {
    if (id in this.lobbyUserList) {
      delete this.lobbyUserList[id];
    }
    console.log('user count =', Object.keys(this.lobbyUserList).length);
  }
  // 룸리스트 정보를 로비에있는 클라이언트 모두에게 업데이트 하기
  SendUpdateRoomList(socket: net.Socket) {
    let kData = new PacketDatas.SNotifyUpdateRoomList(this.roomList);
    let packet = kData.SendData();
    //let list = Object.values(this.lobbyUserList);

    for (let kClient of this.mClients) {
      if (kClient != undefined) {
        kClient.write(packet);
      }
    }
  }
}

export default Lobby;

//module.exports = Lobby;
