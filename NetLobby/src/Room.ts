//const RoomPlayer = require('./RoomPlayer')
import net from 'net';
import RoomPlayer from './RoomPlayer';
import UserInfo from './UserInfo';
import { SORoomPlayer, SNotifyLeaveRoom, SOUser } from './PacketDatas';

//룸에서 유저상태 enum 상수
const ERoomUserSate = {
  Empty: 0, // 빈슬롯
  Enter: 1, // 입장된 상태
  Ready: 2, // 준비된 상태
};

//룸 정보
export class Room {
  roomId: string;
  masterClientId: string;
  maxPlayer: number;
  isOpen: boolean;
  roomState: number;
  removedFromList: boolean;
  slots: number[];
  players: RoomPlayer[];

  constructor(roomId: string = '', masterClientId: string = '', maxPlayer = 4) {
    this.roomId = roomId; // 룸id 또는 룸 이름
    this.masterClientId = masterClientId; // 마스터 클라이언트 id
    this.maxPlayer = maxPlayer; // 최대 플레이어 수
    this.isOpen = true; // true: 입장가능, false: 입장불가능(룸리스트에서 숨기기)
    this.roomState = 0; // 0 : 대기중 , 1 : 게임중
    this.removedFromList = false; //룸 리스트에서 삭제 되었는지 여부
    this.players = []; // 룸 유저리스트 (RoomPlayer 리스트)
    this.slots = []; // 슬롯상태: ERoomUserSate의 0(empty)과 1(Enter)만 사용한다.

    for (let i = 0; i < maxPlayer; i++) {
      this.slots[i] = 0;
    }
  }

  Name(): string {
    return this.roomId;
  }

  // Player 숫자
  PlayerCount(): number {
    return this.players.length;
  }

  // 룸 생성시 마스터 플레이어 정보 셋팅
  Initialize(userInfo: SOUser): void {
    const kPlayer = new RoomPlayer(true);

    kPlayer.userInfo = userInfo;
    kPlayer.slotNo = 1;
    kPlayer.userState = ERoomUserSate.Enter; // 1 = Enter_State

    this.players.push(kPlayer);
    this.roomState = 0;
    this.removedFromList = false;
    this.slots[0] = ERoomUserSate.Enter;
  }

  SetInfo(room: Room): void {
    this.roomId = room.roomId;
    this.masterClientId = room.masterClientId;
    this.maxPlayer = room.maxPlayer;
    this.isOpen = room.isOpen;
    this.roomState = room.roomState;
    this.removedFromList = room.removedFromList;
    for (let i = 0; i < room.slots.length; i++) {
      this.slots[i] = room.slots[i];
    }
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].SetInfo(room.players[i]);
    }
  }

  // 비어있는 슬롯 인덱스 값
  FindEmptySlotIndex(): number | undefined {
    for (var i = 0; i < this.slots.length; i++) {
      if (this.slots[i] == 0) {
        return i;
      }
    }
    return undefined;
  }

  AddPlayer(userInfo: SOUser): SORoomPlayer {
    const kPlayer = new SORoomPlayer(false);
    kPlayer.userInfo = userInfo;
    kPlayer.userState = ERoomUserSate.Enter; // 1 = Enter_State

    let iSlot = this.FindEmptySlotIndex();
    if (iSlot != undefined) {
      kPlayer.slotNo = iSlot + 1; // 슬롯번호는 1부터 시작한다.
      this.slots[iSlot] = ERoomUserSate.Enter;
    } else {
      console.log(`[Err] 비어있는 슬롯이 없습니다.`);
      return kPlayer;
    }
    console.log(`[RoomSlot] = ${this.slots},  slot idx = ${iSlot}`);

    this.players.push(kPlayer);
    return kPlayer;
  }

  // Player 삭제
  RemovePlayer(userId: string) {
    var idx = this.players.findIndex((data) => {
      return data.Name() == userId;
    });
    if (idx != -1) {
      // 슬롯상태를 0으로 초기화 하기
      let slotIdx = this.players[idx].slotNo - 1;
      this.slots[slotIdx] = 0;

      //플레이어 삭제
      this.players.splice(idx, 1); // 삭제
    }
  }

  // Player 찾기
  FindPlayer(userId: string): RoomPlayer | undefined {
    const kPlayer = this.players.find((e) => {
      return e.Name() == userId;
    });
    return kPlayer;
  }

  FirstPlayer(): RoomPlayer | undefined {
    if (this.players.length > 0) return this.players[0];
    return undefined;
  }

  // 룸 나간 유저 브로드 캐스팅하기
  SendLeaveRoomPlayer(socket: net.Socket, userId: string) {
    for (let kPlayer of this.players) {
      if (kPlayer.Id() != userId) {
        let kNotiData = new SNotifyLeaveRoom(this.roomId, kPlayer.Id());
        let packet = kNotiData.SendData();
        socket.write(packet);
      }
    }
  }

  // 슬롯 0으로 초기화하기
  ClearSlot(): void {
    for (var i = 0; i < this.slots.length; i++) {
      this.slots[i] = 0;
    }
  }
}

export default Room;
//module.exports = Room;
