import UserInfo from './UserInfo';
import * as Lobby from './Lobby';
import Room from './Room';
import RoomPlayer from './RoomPlayer';

// 룸 상태
export enum ERoomState {
   Ready = 0,     // 게임 시작 전 상태
   Game = 1,      // 게임중 상태
};

// 유저(룸슬롯) 상태
export enum EUserState {
   Empty = 0,     // 빈슬롯인 경우
   Enter = 1,     // 룸 입장상태
   Ready = 2,     // 게임 시작 대기 상태
};

export enum EPacket {
   Req_createId = 11001,      // 계정생성 요청
   Ack_createId,              // 계정생성 응답
   Req_login,                 // 로그인 요청
   Ack_login,                 // 로그인 응답
   Req_logout,                // 로그아웃 요청
   Ack_logout,                // 로그아웃 응답
   Notify_logout,             // 로그아웃 통지
   Req_userInfo,              // 유저정보 요청
   Ack_userInfo,              // 유정정보 응답
   Req_withdraw,              // 탈퇴 요청
   Ack_withdraw,              // 탈퇴 응답
   Req_init_roomlist,         // 로그인 성공시 룸리스트 요청
   Ack_init_roomlist,         // 로그인 성공시 룸리스트 응답
   Req_create_room,           // 룸생성 요청
   Ack_create_room,           // 룸생성 응답
   Notify_update_roomlist,    // 룰리스트 업데이트 통지
   Req_join_room,             // 룸 조인 요청
   Ack_join_room,             // 룸 조인 응답
   Notify_enter_room,         // 룸 입장 통지 
   Req_leave_room,            // 룸 나가기 요청
   Ack_leave_room,            // 룸 나가기 응답
   Notify_leave_room,         // 룸 나가기 통지
   Req_room_ready,            // 룸 유저 Ready 요청
   Ack_room_ready,            // 룸 유저 Ready 응답
   Notify_room_ready,         // 룸 유저 Ready 통지
   Req_room_chat,             // 룸 챗팅 요청 
   Ack_room_chat,             // 룸 챗팅 응답
   Notify_room_chat,          // 룸 챗팅 통지
   Req_game_start,            // 게임시작 요청
   Ack_game_start,            // 게임시작 응답
   Notify_game_start,         // 게임시작 통지
   Req_game_end,              // 게임종료 요쳥
   Ack_game_end,              // 게임종료 응답
   Notify_game_end,           // 게임종료 통지
   Req_disconnect,            // 연결해제 요청
   Ack_disconnect             // 연결해제 응답
}

export const _PID:number = 0x7e21;          // 프리픽스 ID 값 : ~, !

// 기본비교 PrefixId(2), id(2), length(2), checksum(1)
// length 는 헤더를 제외한 실제 데이터 길이 ( 7byte 제외된 크기 ) 
// Packet 길이 :  PrefixId(2) + id(2) + length(2) + 실제 data length + checksum(1) = 총길이 : 7 + data길이
export class PacketBase {
   pid : number;        // Prefix ID ( 2 )
   id : number;         // Packet ID ( 2 )
   size : number;       // Packet Size ( 2 )
   cheksum: number;     // 체크섬 ( 1 )

   constructor(id:number) {
      this.pid = _PID;
      this.id = id;
      this.size = 0;
      this.cheksum = 0;
   }
}

// 유저 리스트
export class SOUserInfoList{
   datas : UserInfo[];
   constructor() {
      this.datas = [];
   }
}

// 계정생성 요청
export class SReqCreateId extends PacketBase{
   userId:string;
   success:number;
   constructor(uesrId:string="", success:number = 0) {
      super(EPacket.Req_createId);

      this.userId = uesrId;
      this.success = success;
   }
}
// 계정생성 응답
export class SAckCreateId extends PacketBase{
   userId:string;
   success:number;
   constructor(uesrId:string="", success:number = 0) {
      super(EPacket.Ack_createId);

      this.userId = uesrId;
      this.success = success;
   }
}
// 로그인 요청
export class SReqLogin extends PacketBase{
   userId:string;
   pass:string;
   constructor(userId:string, pass:string) {
      super(EPacket.Req_login);
      this.userId = userId;
      this.pass = pass;
   }
}
// 로그인 응답
export class SAckLogin extends PacketBase{
   userId:string;
   success:number;
   constructor(userId:string, success:number) {
      super(EPacket.Ack_login);
      this.userId = userId;
      this.success = success;
   }
}
// 로그아웃 요청
export class SReqLogout extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Req_logout);
      this.userId = userId;
   }
}
// 로그아웃 응답
export class SAckLogout extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Ack_logout);
      this.userId = userId;
   }
}
// 로그아웃 통지
export class SNotifyLogout extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Notify_logout);
      this.userId = userId;
   }
}
// 유저정보 요청
export class SReqUserInfo extends PacketBase{
   userInfo:UserInfo = new UserInfo();
   constructor(userInfo:UserInfo) {
      super(EPacket.Req_userInfo);
      this.userInfo.SetInfo(userInfo);
   }
}
// 유저정보 응답
export class SAckUserInfo extends PacketBase{
   userInfo:UserInfo = new UserInfo();
   constructor(userInfo:UserInfo) {
      super(EPacket.Ack_userInfo);
      this.userInfo.SetInfo(userInfo);
   }
}
// 탈퇴 요청
export class SReqWithdraw extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Req_withdraw);
      this.userId = userId;
   }
}
// 탈퇴 응답
export class SAckWithdraw extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Ack_withdraw);
      this.userId = userId;
   }
}
// 룸리스트 정보 요청
export class SReqInitRoomList extends PacketBase{
   userId:string;
   constructor(userId:string) {
      super(EPacket.Req_init_roomlist);
      this.userId = userId;
   }
}
// 룸리스트 정보 요청
export class SAckInitRoomList extends PacketBase{
   datas:Lobby.IDictionary<Room>;
   constructor(datas:Lobby.IDictionary<Room>) {
      super(EPacket.Ack_init_roomlist);
      this.datas = datas;
      // for( let key in datas ) {
      //    let kRoom = datas[key];
      //    this.datas[key] = kRoom;
      // }
   }
}
// 룸 생성 요청
export class SReqCreateRoom extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string, userId:string) {
      super(EPacket.Req_create_room);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 룸 생성 응답
export class SAckCreateRoom extends PacketBase{
   success:number;
   room?:Room;
   constructor(success:number, room?:Room) {
      super(EPacket.Req_create_room);
      this.success = success;
      this.room = room;
   }
}
// 룸 리스트 변경 통지
export class SNotifyUpdateRoomList extends PacketBase{
   datas:Lobby.IDictionary<Room>;
   constructor(datas:Lobby.IDictionary<Room>) {
      super(EPacket.Notify_update_roomlist);
      this.datas = datas;
   }
}

// 룸 가입 요청
export class SReqJoinRoom extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string, userId:string) {
      super(EPacket.Req_join_room);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 룸 가입 응답
export class SAckJoinRoom extends PacketBase{
   success:number;
   room?:Room;
   constructor(success:number, room?:Room) {
      super(EPacket.Ack_join_room);
      this.success = success;
      this.room = room;
   }
}

// 룸 입장 통지
export class SNotifyEnterRoom extends PacketBase{
   roomPlayer?:RoomPlayer;
   constructor(roomPlayer?:RoomPlayer) {
      super(EPacket.Notify_enter_room);
      this.roomPlayer = roomPlayer;
   }
}

// 룸 나가기 요청
export class SReqLeaveRoom extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Req_leave_room);
      this.roomName = roomName;
      this.userId = userId;
   }
}

// 룸 나가기 응답
export class SAckLeaveRoom extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Ack_leave_room);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 룸 나가기 통지
export class SNotifyLeaveRoom extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Notify_leave_room);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 룸 Ready 요청
export class SReqRoomUserReady extends PacketBase{
   roomName:string;
   userId:string;
   userState:number;
   constructor(roomName:string="", userId:string="", userState:number=0) {
      super(EPacket.Req_room_ready);
      this.roomName = roomName;
      this.userId = userId;
      this.userState = userState;
   }
}
// 룸 Ready 응답
export class SAckRoomUserReady extends PacketBase{
   roomName:string;
   userId:string;
   userState:number;
   constructor(roomName:string="", userId:string="", userState:number=0) {
      super(EPacket.Ack_room_ready);
      this.roomName = roomName;
      this.userId = userId;
      this.userState = userState;
   }
}
// 룸 Ready 통지
export class SNotifyRoomUserReady extends PacketBase{
   roomName:string;
   userId:string;
   userState:number;
   constructor(roomName:string="", userId:string="", userState:number=0) {
      super(EPacket.Notify_room_ready);
      this.roomName = roomName;
      this.userId = userId;
      this.userState = userState;
   }
}

// 룸 chatting 요청
export class SReqRoomChat extends PacketBase{
   roomName:string;
   userId:string;
   msg:string;
   constructor(roomName:string="", userId:string="", msg:string="") {
      super(EPacket.Req_room_chat);
      this.roomName = roomName;
      this.userId = userId;
      this.msg = msg;
   }
}
// 룸 chatting 응답
export class SAckRoomChat extends PacketBase{
   roomName:string;
   userId:string;
   msg:string;
   constructor(roomName:string="", userId:string="", msg:string="") {
      super(EPacket.Ack_room_chat);
      this.roomName = roomName;
      this.userId = userId;
      this.msg = msg;
   }
}
// 룸 chatting 통지
export class SNotifyRoomChat extends PacketBase{
   roomName:string;
   userId:string;
   msg:string;
   constructor(roomName:string="", userId:string="", msg:string="") {
      super(EPacket.Notify_room_chat);
      this.roomName = roomName;
      this.userId = userId;
      this.msg = msg;
   }
}

// 게임시작 요청
export class SReqGameStart extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Req_game_start);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 게임시작 응답
export class SAckGameStart extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Ack_game_start);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 게임시작 통지
export class SNotifyGameStart extends PacketBase{
   start:boolean;
   constructor(start:boolean=true) {
      super(EPacket.Notify_game_start);
      this.start = start;
   }
}
// 게임종료 요청
export class SReqGameEnd extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Req_game_end);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 게임종료 응답
export class SAckGameEnd extends PacketBase{
   roomName:string;
   userId:string;
   constructor(roomName:string="", userId:string="") {
      super(EPacket.Ack_game_end);
      this.roomName = roomName;
      this.userId = userId;
   }
}
// 게임종료 통지
export class SNotifyGameEnd extends PacketBase{
   end:boolean;
   constructor(end:boolean=true) {
      super(EPacket.Notify_game_end);
      this.end = end; 
   }
}







// Req_game_start,            // 게임시작 요청
// Ack_game_start,            // 게임시작 응답
// Notify_game_start,         // 게임시작 통지
// Req_game_end,              // 게임종료 요쳥
// Ack_game_end,              // 게임종료 응답
// Notify_game_end,           // 게임종료 통지


// // 룸 플레이어
// export class SRoomPlayer{

//    constructor(
//          public isMaster:boolean, 
//          public userState:boolean,
//          public slotNo:number,
//          public isAlive:boolean,
//          public userInfo:UserInfo  
//          ) {
//       this.isMaster = isMaster;
//       this.userState = userState;
//       this.slotNo = slotNo;
//       this.isAlive = isAlive;
//       userInfo = new UserInfo();
//       userInfo.SetInfo(userInfo);      
//    }
// }

// export class SRoom{

//    constructor(
//          public roomId:string,     // 룸 이름 
//          public masterClientId:string,
//          public maxPlayer:number,
//          public isOpen:boolean,
//          public roomState:number,
//          public removedFromList:boolean,
//          public players:SRoomPlayer[],    // 
//          public slots:number[]            // 룸 슬롯  
//          ) {
//       this.roomId = roomId;
//       this.masterClientId = masterClientId;
//       this.maxPlayer = maxPlayer;
//       this.isOpen
//    }
// }









//export default PacketDatas;






