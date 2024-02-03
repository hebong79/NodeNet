import net from 'net';
import UserInfo from './UserInfo';
import * as Lobby from './Lobby';
import { IDictionary } from './Lobby';
import Room from './Room';
import RoomPlayer from './RoomPlayer';

// 계정생성 정보
export enum ECreateId {
  Success = 0, // 성공
  Fail = 1, // 실패
}

// 룸 상태
export enum ERoomState {
  Ready = 0, // 게임 시작 전 상태
  Game = 1, // 게임중 상태
}

// 유저(룸슬롯) 상태
export enum EUserState {
  Empty = 0, // 빈슬롯인 경우
  Enter = 1, // 룸 입장상태
  Ready = 2, // 게임 시작 대기 상태
}

export enum EPacket {
  Req_createId = 11001, // 계정생성 요청
  Ack_createId, // 계정생성 응답
  Req_login, // 로그인 요청
  Ack_login, // 로그인 응답
  Req_logout, // 로그아웃 요청
  Ack_logout, // 로그아웃 응답
  Notify_logout, // 로그아웃 통지
  Req_userInfo, // 유저정보 요청
  Ack_userInfo, // 유정정보 응답
  Req_withdraw, // 탈퇴 요청
  Ack_withdraw, // 탈퇴 응답
  Req_init_roomlist, // 로그인 성공시 룸리스트 요청
  Ack_init_roomlist, // 로그인 성공시 룸리스트 응답
  Req_create_room, // 룸생성 요청
  Ack_create_room, // 룸생성 응답
  Notify_update_roomlist, // 룰리스트 업데이트 통지
  Req_join_room, // 룸 조인 요청
  Ack_join_room, // 룸 조인 응답
  Notify_enter_room, // 룸 입장 통지
  Req_leave_room, // 룸 나가기 요청
  Ack_leave_room, // 룸 나가기 응답
  Notify_leave_room, // 룸 나가기 통지
  Req_room_ready, // 룸 유저 Ready 요청
  Ack_room_ready, // 룸 유저 Ready 응답
  Notify_room_ready, // 룸 유저 Ready 통지
  Req_room_chat, // 룸 챗팅 요청
  Ack_room_chat, // 룸 챗팅 응답
  Notify_room_chat, // 룸 챗팅 통지
  Notify_change_master, // 룸마스터 변경
  Req_game_start, // 게임시작 요청
  Ack_game_start, // 게임시작 응답
  Notify_game_start, // 게임시작 통지
  Req_game_end, // 게임종료 요쳥
  Ack_game_end, // 게임종료 응답
  Notify_game_end, // 게임종료 통지
  Req_disconnect, // 연결해제 요청
  Ack_disconnect, // 연결해제 응답
}

export const _PID: number = 0x7e21; // 프리픽스 ID 값 : ~, !

// 레퍼런스 인덱스를 위한 클래스
class RefIdx {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

export class CPacket {
  // 버퍼로 부터 문자열 읽기
  // 반환값 : 문자열, 버퍼를 읽을 다음 인덱스
  static readString(data: Buffer, index: RefIdx): string {
    let strSize = data.readIntLE(index.value, 2);
    index.value += 2;
    const strBuf = Buffer.alloc(strSize);
    data.copy(strBuf, 0, index.value, index.value + strSize);
    let str = strBuf.toString('utf-8');
    return str;
  }
  // 버퍼에 문자열 쓰기
  // 반환값: 버퍼에 쓸 다음 인덱스
  static writeString(data: Buffer, str: string, index: RefIdx): number {
    let strSize = Buffer.byteLength(str, 'utf-8');
    data.writeInt16LE(strSize, index.value);
    index.value += 2;
    data.write(str, 'utf-8');
    index.value += strSize;
    return index.value;
  }
}

// 기본비교 PrefixId(2), id(2), size(2), checksum(1)
// size 는 헤더를 제외한 실제 데이터 길이 ( 7byte 제외된 크기 )
// Packet 길이 :  PrefixId(2) + id(2) + length(2) + 실제 data length + checksum(1) = 총길이 : 7 + data길이
export class PacketBase {
  pid: number; // Prefix ID ( 2 ) - Packet 인지 확인용
  id: number; // Packet ID ( 2 )
  size: number; // Packet Size ( 2 ) - 패킷 크기( 실제 Body 사이즈 - 헤더(7) 제외된 크기)
  cheksum: number; // 체크섬 ( 1 ) - 정상적인 패킷인지 확이을 위한값

  constructor(id: number) {
    this.pid = _PID;
    this.id = id;
    this.size = 0;
    this.cheksum = 0;
  }

  // 실제 data Buffer의 시작 인덱스
  getBodyIndex(): number {
    return 6;
  }

  // 체크섬 포함한 헤더 크기
  getHeaderSize(): number {
    return 7;
  }

  // 버퍼로 부터 문자열 읽기
  // 반환값 : 문자열, 버퍼를 읽을 다음 인덱스
  readString(data: Buffer, index: RefIdx): string {
    let strSize = data.readIntLE(index.value, 2);
    index.value += 2;
    const strBuf = Buffer.alloc(strSize);
    data.copy(strBuf, 0, index.value, index.value + strSize);
    let str = strBuf.toString('utf-8');
    return str;
  }
  // 버퍼에 문자열 쓰기
  // 반환값: 버퍼에 쓸 다음 인덱스
  writeString(data: Buffer, str: string, index: RefIdx): number {
    let strSize = Buffer.byteLength(str, 'utf-8');
    data.writeInt16LE(strSize, index.value);
    index.value += 2;
    data.write(str, 'utf-8');
    index.value += strSize;
    return index.value;
  }
  // 헤더부분 Send data
  // 다음버퍼 시작 index를 리턴한다.
  SendDataHeader(data: Buffer): number {
    let index = 0;
    data.writeInt16LE(this.pid, index);
    index += 2;
    data.writeInt16LE(this.id, index);
    index += 2;
    data.writeInt16LE(this.size, index);
    index += 2;
    return index;
  }
}

// UserInfo에 통신 함수만 추가한 클래스
export class SOUser extends UserInfo {
  socket?: net.Socket;
  constructor(
    userId: string = '',
    ip: string = '',
    publicIp: string = '',
    dataPort: number = 0,
    movePort: number = 0
  ) {
    super(userId, ip, publicIp, dataPort, movePort);
    this.socket = undefined;
  }
  // 패킷 크기
  PacketSize(): number {
    return this.GetPacketSize();
  }

  ReceiveData(data: Buffer, rIdx: RefIdx): void {
    this.userId = CPacket.readString(data, rIdx);
    this.ip = CPacket.readString(data, rIdx);
    this.publicIp = CPacket.readString(data, rIdx);
    this.dataPort = data.readIntLE(rIdx.value, 4);
    rIdx.value += 4;
    this.movePort = data.readIntLE(rIdx.value, 4);
    rIdx.value += 4;
  }

  SendData(data: Buffer, rIdx: RefIdx): void {
    CPacket.writeString(data, this.userId, rIdx);
    CPacket.writeString(data, this.ip, rIdx);
    CPacket.writeString(data, this.publicIp, rIdx);
    data.writeIntLE(this.dataPort, rIdx.value, 4);
    rIdx.value += 4;
    data.writeIntLE(this.movePort, rIdx.value, 4);
    rIdx.value += 4;
  }
}

export class SORoomPlayer extends RoomPlayer {
  constructor(isMaster: boolean = false) {
    super(isMaster);
  }
  // 패킷 크기
  PacketSize(): number {
    return this.GetPacketSize();
  }

  ReceiveData(data: Buffer, rIdx: RefIdx): void {
    let bMaster = data.readIntLE(rIdx.value, 1);
    rIdx.value += 1;
    this.isMaster = bMaster == 1 ? true : false;
    this.userState = data.readIntLE(rIdx.value, 4);
    rIdx.value += 4;
    this.slotNo = data.readIntLE(rIdx.value, 4);
    rIdx.value += 4;
    let bAlive = data.readIntLE(rIdx.value, 1);
    rIdx.value += 1;
    this.isAlive = bAlive == 1 ? true : false;
    this.userInfo.ReceiveData(data, rIdx);
  }

  SendData(data: Buffer, rIdx: RefIdx): void {
    data.writeIntLE(this.isMaster ? 1 : 0, rIdx.value, 1);
    rIdx.value += 1;
    data.writeIntLE(this.userState, rIdx.value, 4);
    rIdx.value += 4;
    data.writeIntLE(this.slotNo, rIdx.value, 4);
    rIdx.value += 4;
    data.writeIntLE(this.isAlive ? 1 : 0, rIdx.value, 1);
    rIdx.value += 1;
    this.userInfo.SendData(data, rIdx);
  }
}

export class SORoom extends Room {
  constructor(roomId: string = '', masterClientId: string = '', maxPlayer = 4) {
    super(roomId, masterClientId, maxPlayer);
  }
  // 패킷 크기
  PacketSize(): number {
    let lenRoomId = Buffer.byteLength(this.roomId, 'utf-8') + 2;
    let lenMasterClientId = Buffer.byteLength(this.masterClientId, 'utf-8') + 2;
    let etc = 1 + 4 + 1 + this.maxPlayer * 4; // boolean = 1byte
    let playersLen = this.PlayerCount() * this.players[0].GetPacketSize();
    return lenRoomId + lenMasterClientId + etc + playersLen;
  }

  ReceiveData(data: Buffer, rIdx: RefIdx): void {
    if (this.players.length > 0) {
      this.players.slice(0, this.players.length - 1);
    }

    this.roomId = CPacket.readString(data, rIdx);
    this.masterClientId = CPacket.readString(data, rIdx);
    this.maxPlayer = data.readIntLE(rIdx.value, 4);
    let bOpen = data.readIntLE(rIdx.value, 1);
    this.isOpen = bOpen == 1 ? true : false;
    let bRemovedFromList = data.readIntLE(rIdx.value, 1);
    this.removedFromList = bRemovedFromList == 1 ? true : false;
    for (let i = 0; i < this.maxPlayer; i++) {
      this.slots[i] = data.readIntLE(rIdx.value, 4);
      rIdx.value += 4;
    }
    let playerLen = data.readIntLE(rIdx.value, 2);
    for (let i = 0; i < playerLen; i++) {
      const kPlayer: SORoomPlayer = new SORoomPlayer();
      kPlayer.ReceiveData(data, rIdx);
      let newPlayer = new RoomPlayer();
      newPlayer.SetInfo(kPlayer);
      this.players.push(newPlayer);
    }
  }

  SendData(data: Buffer, rIdx: RefIdx): void {
    CPacket.writeString(data, this.roomId, rIdx);
    CPacket.writeString(data, this.masterClientId, rIdx);
    data.writeIntLE(this.maxPlayer, rIdx.value, 4);
    rIdx.value += 4;
    data.writeIntLE(this.isOpen == true ? 1 : 0, rIdx.value, 1);
    rIdx.value += 1;
    data.writeIntLE(this.roomState, rIdx.value, 4);
    rIdx.value += 4;
    data.writeIntLE(this.removedFromList == true ? 1 : 0, rIdx.value, 1);
    rIdx.value += 1;
    for (let slot of this.slots) {
      data.writeIntLE(slot, rIdx.value, 4);
      rIdx.value += 4;
    }
    data.writeIntLE(this.players.length, rIdx.value, 2);
    for (let item of this.players) {
      const kPlayer = new SORoomPlayer();
      kPlayer.SetInfo(item);
      kPlayer.SendData(data, rIdx);
    }
  }
}

// 유저 리스트
export class SOUserInfoList {
  datas: UserInfo[];
  constructor() {
    this.datas = [];
  }
}

// 계정생성 요청
export class SReqCreateId extends PacketBase {
  userId: string;
  pass: string;
  constructor(uesrId: string = '', pass: string = '') {
    super(EPacket.Req_createId);
    this.userId = uesrId;
    this.pass = pass;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    strSize += 2;
    strSize += Buffer.byteLength(this.pass, 'utf-8');
    strSize += 2;
    return this.getHeaderSize() + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
    this.pass = this.readString(data, rIdx);
  }
  // 보내기 데이타 처리
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    this.writeString(data, this.pass, rIdx);
    return data;
  }
}
// 계정생성 응답
export class SAckCreateId extends PacketBase {
  userId: string;
  success: number;
  constructor(uesrId: string = '', success: number = 0) {
    super(EPacket.Ack_createId);

    this.userId = uesrId;
    this.success = success;
  }

  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 4;
  }
  // 받은 데이타 처리
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();

    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
    this.success = data.readIntLE(rIdx.value, 4);
  }
  // 보내기 데이타 처리
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    data.writeIntLE(this.success, rIdx.value, 4);
    return data;
  }
}

// 로그인 요청
export class SReqLogin extends PacketBase {
  userId: string;
  pass: string;
  constructor(userId: string = '', pass: string = '') {
    super(EPacket.Req_login);
    this.userId = userId;
    this.pass = pass;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    let strSize2 = Buffer.byteLength(this.pass, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
    this.pass = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    this.writeString(data, this.pass, rIdx);
    return data;
  }
}
// 로그인 응답
export class SAckLogin extends PacketBase {
  userId: string;
  success: number;
  constructor(userId: string, success: number) {
    super(EPacket.Ack_login);
    this.userId = userId;
    this.success = success;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 4;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();

    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
    this.success = data.readIntLE(rIdx.value, 4);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    data.writeIntLE(this.success, rIdx.value, 4);
    return data;
  }
}
// 로그아웃 요청
export class SReqLogout extends PacketBase {
  userId: string;
  constructor(userId: string = '') {
    super(EPacket.Req_logout);
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 로그아웃 응답
export class SAckLogout extends SReqLogout {
  constructor(userId: string = '') {
    super(userId);
    this.id = EPacket.Ack_logout;
  }
}
// 로그아웃 통지
export class SNotifyLogout extends SReqLogout {
  constructor(userId: string = '') {
    super(userId);
    this.id = EPacket.Notify_logout;
  }
}

// 유저정보 요청
export class SReqUserInfo extends PacketBase {
  user: SOUser = new SOUser();
  constructor(userInfo?: UserInfo) {
    super(EPacket.Req_userInfo);
    if (userInfo != undefined) {
      this.user.SetInfo(userInfo);
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = this.user.PacketSize();
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.user.ReceiveData(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.user.SendData(data, rIdx);
    return data;
  }
}
// 유저정보 응답
export class SAckUserInfo extends PacketBase {
  user: SOUser = new SOUser();
  constructor(userInfo: UserInfo) {
    super(EPacket.Ack_userInfo);
    this.user.SetInfo(userInfo);
  }
  // 패킷 크기
  PacketSize(): number {
    let size = this.user.PacketSize();
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.user.ReceiveData(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.user.SendData(data, rIdx);
    return data;
  }
}
// 탈퇴 요청
export class SReqWithdraw extends PacketBase {
  userId: string;
  constructor(userId: string = '') {
    super(EPacket.Req_withdraw);
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 탈퇴 응답
export class SAckWithdraw extends PacketBase {
  userId: string;
  constructor(userId: string) {
    super(EPacket.Ack_withdraw);
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸리스트 정보 요청
export class SReqInitRoomList extends PacketBase {
  userId: string;
  constructor(userId: string = '') {
    super(EPacket.Req_init_roomlist);
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸리스트 정보 요청
export class SAckInitRoomList extends PacketBase {
  datas: IDictionary<SORoom>;
  constructor(datas?: IDictionary<SORoom>) {
    super(EPacket.Ack_init_roomlist);
    if (datas != undefined) {
      this.datas = datas;
    } else {
      this.datas = {};
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = this.getHeaderSize() + 2;
    //const list = Object.values(this.datas);
    for (let key in this.datas) {
      size += this.datas[key].PacketSize();
    }
    return size;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    let count = data.readIntLE(rIdx.value, 2);
    rIdx.value += 2;
    for (let i = 0; i < count; i++) {
      let kRoom = new SORoom();
      kRoom.ReceiveData(data, rIdx);
      this.datas[kRoom.Name()] = kRoom;
    }
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    let list: SORoom[] = Object.values(this.datas);
    data.writeIntLE(list.length, rIdx.value, 2);
    for (let kRoom of list) {
      kRoom.SendData(data, rIdx);
    }
    return data;
  }

  RemoveAll(): void {
    // 객체의 모든 키를 가져와서 각각의 속성을 삭제
    Object.keys(this.datas).forEach((key) => delete this.datas[key]);
  }
}
// 룸 생성 요청
export class SReqCreateRoom extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_create_room);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸 생성 응답
export class SAckCreateRoom extends PacketBase {
  success: number;
  room: SORoom;
  constructor(success: number, room?: SORoom) {
    super(EPacket.Req_create_room);
    this.success = success;
    if (room != undefined) {
      this.room = room;
    } else {
      this.room = new SORoom();
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = 4;
    size += this.room.PacketSize();
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();

    let rIdx = new RefIdx(index);
    this.success = data.readIntLE(rIdx.value, 4);
    this.room.ReceiveData(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    data.writeIntLE(this.success, rIdx.value, 4);
    this.room.SendData(data, rIdx);
    return data;
  }
}
// 룸 리스트 변경 통지
export class SNotifyUpdateRoomList extends PacketBase {
  datas: IDictionary<SORoom>;
  constructor(datas?: IDictionary<SORoom>) {
    super(EPacket.Notify_update_roomlist);
    if (datas != undefined) {
      this.datas = datas;
    } else {
      this.datas = {};
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = this.getHeaderSize() + 2;
    //const list = Object.values(this.datas);
    for (let key in this.datas) {
      size += this.datas[key].PacketSize();
    }
    return size;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    let count = data.readIntLE(rIdx.value, 2);
    rIdx.value += 2;
    for (let i = 0; i < count; i++) {
      let kRoom = new SORoom();
      kRoom.ReceiveData(data, rIdx);
      this.datas[kRoom.Name()] = kRoom;
    }
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    let list: SORoom[] = Object.values(this.datas);
    data.writeIntLE(list.length, rIdx.value, 2);
    for (let kRoom of list) {
      kRoom.SendData(data, rIdx);
    }
    return data;
  }
  RemoveAll(): void {
    // 객체의 모든 키를 가져와서 각각의 속성을 삭제
    Object.keys(this.datas).forEach((key) => delete this.datas[key]);
  }
}

// 룸 가입 요청
export class SReqJoinRoom extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_join_room);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸 가입 응답
export class SAckJoinRoom extends PacketBase {
  success: number;
  room: SORoom;
  constructor(success: number, room?: SORoom) {
    super(EPacket.Ack_join_room);
    this.success = success;
    if (room != undefined) {
      this.room = room;
    } else {
      this.room = new SORoom();
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = 4;
    size += this.room.PacketSize();
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();

    let rIdx = new RefIdx(index);
    this.success = data.readIntLE(rIdx.value, 4);
    this.room.ReceiveData(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    data.writeIntLE(this.success, rIdx.value, 4);
    this.room.SendData(data, rIdx);
    return data;
  }
}

// 룸 입장 통지
export class SNotifyEnterRoom extends PacketBase {
  roomPlayer: SORoomPlayer;
  constructor(roomPlayer?: SORoomPlayer) {
    super(EPacket.Notify_enter_room);
    if (roomPlayer != undefined) {
      this.roomPlayer = roomPlayer;
    } else {
      this.roomPlayer = new SORoomPlayer();
    }
  }
  // 패킷 크기
  PacketSize(): number {
    let size = this.roomPlayer.PacketSize();
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomPlayer.ReceiveData(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.roomPlayer.SendData(data, rIdx);
    return data;
  }
}

// 룸 나가기 요청
export class SReqLeaveRoom extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_leave_room);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}

// 룸 나가기 응답
export class SAckLeaveRoom extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Ack_leave_room);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸 나가기 통지
export class SNotifyLeaveRoom extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Notify_leave_room);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 룸 Ready 요청
export class SReqRoomUserReady extends PacketBase {
  roomName: string;
  userId: string;
  userState: number;
  constructor(
    roomName: string = '',
    userId: string = '',
    userState: number = 0
  ) {
    super(EPacket.Req_room_ready);
    this.roomName = roomName;
    this.userId = userId;
    this.userState = userState;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2 + 4;
  }

  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
    this.userState = data.readIntLE(rIdx.value, 4);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    data.writeIntLE(this.userState, rIdx.value, 4);
    return data;
  }
}
// 룸 Ready 응답
export class SAckRoomUserReady extends SReqRoomUserReady {
  constructor(
    roomName: string = '',
    userId: string = '',
    userState: number = 0
  ) {
    super(roomName, userId, userState);
    this.id = EPacket.Ack_room_ready;
  }
}
// 룸 Ready 통지
export class SNotifyRoomUserReady extends SReqRoomUserReady {
  constructor(
    roomName: string = '',
    userId: string = '',
    userState: number = 0
  ) {
    super(roomName, userId, userState);
    this.id = EPacket.Notify_room_ready;
  }
}

// 룸 chatting 요청
export class SReqRoomChat extends PacketBase {
  roomName: string;
  userId: string;
  msg: string;
  constructor(roomName: string = '', userId: string = '', msg: string = '') {
    super(EPacket.Req_room_chat);
    this.roomName = roomName;
    this.userId = userId;
    this.msg = msg;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    let strSize3 = Buffer.byteLength(this.msg, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2 + 2 + strSize3;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
    this.msg = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    this.writeString(data, this.msg, rIdx);
    return data;
  }
}
// 룸 chatting 응답
export class SAckRoomChat extends SReqRoomChat {
  constructor(roomName: string = '', userId: string = '', msg: string = '') {
    super(roomName, userId, msg);
    this.id = EPacket.Ack_room_chat;
  }
}
// 룸 chatting 통지
export class SNotifyRoomChat extends SReqRoomChat {
  constructor(roomName: string = '', userId: string = '', msg: string = '') {
    super(roomName, userId, msg);
    this.id = EPacket.Notify_room_chat;
  }
}
export class SReqChangeMaster extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_game_start);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }

}

// 게임시작 요청
export class SReqGameStart extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_game_start);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 게임시작 응답
export class SAckGameStart extends SReqGameStart {
  constructor(roomName: string = '', userId: string = '') {
    super(roomName, userId);
    this.id = EPacket.Ack_game_start;
  }
}
// 게임시작 통지
export class SNotifyGameStart extends PacketBase {
  start: boolean;
  constructor(start: boolean = true) {
    super(EPacket.Notify_game_start);
    this.start = start;
  }
}
// 게임종료 요청
export class SReqGameEnd extends PacketBase {
  roomName: string;
  userId: string;
  constructor(roomName: string = '', userId: string = '') {
    super(EPacket.Req_game_end);
    this.roomName = roomName;
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.roomName, 'utf-8');
    let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.roomName = this.readString(data, rIdx);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.roomName, rIdx);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 게임종료 응답
export class SAckGameEnd extends SReqGameEnd {
  constructor(roomName: string = '', userId: string = '') {
    super(roomName, userId);
    this.id = EPacket.Ack_game_end;
  }
}
// 게임종료 통지
export class SNotifyGameEnd extends PacketBase {
  end: boolean;
  constructor(end: boolean = true) {
    super(EPacket.Notify_game_end);
    this.end = end;
  }
  // 패킷 크기
  PacketSize(): number {
    let size = 1;
    return this.getHeaderSize() + size;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();

    let rIdx = new RefIdx(index);
    let kValue = data.readIntLE(rIdx.value, 1);
    this.end = kValue == 0 ? false : true;
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    data.writeIntLE(this.end ? 1 : 0, rIdx.value, 1);
    return data;
  }
}
// 네트웍 연결해제 요청
export class SReqDisconnect extends PacketBase {
  userId: string;
  constructor(userId: string = '') {
    super(EPacket.Req_disconnect);
    this.userId = userId;
  }
  // 패킷 크기
  PacketSize(): number {
    let strSize = Buffer.byteLength(this.userId, 'utf-8');
    return this.getHeaderSize() + 2 + strSize;
  }
  ReceiveData(data: Buffer) {
    let index = this.getBodyIndex();
    let rIdx = new RefIdx(index);
    this.userId = this.readString(data, rIdx);
  }
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    let index = this.SendDataHeader(data);
    let rIdx = new RefIdx(index);
    this.writeString(data, this.userId, rIdx);
    return data;
  }
}
// 네트웍 연결해제 응답
export class SAckDisconnect extends PacketBase {
  constructor() {
    super(EPacket.Req_disconnect);
  }
  // 패킷 크기
  PacketSize(): number {
    return this.getHeaderSize();
  }
  ReceiveData(data: Buffer) {}
  SendData(): Buffer {
    let data = Buffer.alloc(this.PacketSize());
    this.SendDataHeader(data);
    return data;
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
