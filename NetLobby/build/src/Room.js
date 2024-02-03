"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const RoomPlayer_1 = __importDefault(require("./RoomPlayer"));
const PacketDatas_1 = require("./PacketDatas");
//룸에서 유저상태 enum 상수
const ERoomUserSate = {
    Empty: 0, // 빈슬롯
    Enter: 1, // 입장된 상태
    Ready: 2, // 준비된 상태
};
//룸 정보
class Room {
    constructor(roomId = '', masterClientId = '', maxPlayer = 4) {
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
    Name() {
        return this.roomId;
    }
    // Player 숫자
    PlayerCount() {
        return this.players.length;
    }
    // 룸 생성시 마스터 플레이어 정보 셋팅
    Initialize(userInfo) {
        const kPlayer = new RoomPlayer_1.default(true);
        kPlayer.userInfo = userInfo;
        kPlayer.slotNo = 1;
        kPlayer.userState = ERoomUserSate.Enter; // 1 = Enter_State
        this.players.push(kPlayer);
        this.roomState = 0;
        this.removedFromList = false;
        this.slots[0] = ERoomUserSate.Enter;
    }
    SetInfo(room) {
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
    FindEmptySlotIndex() {
        for (var i = 0; i < this.slots.length; i++) {
            if (this.slots[i] == 0) {
                return i;
            }
        }
        return undefined;
    }
    AddPlayer(userInfo) {
        const kPlayer = new PacketDatas_1.SORoomPlayer(false);
        kPlayer.userInfo = userInfo;
        kPlayer.userState = ERoomUserSate.Enter; // 1 = Enter_State
        let iSlot = this.FindEmptySlotIndex();
        if (iSlot != undefined) {
            kPlayer.slotNo = iSlot + 1; // 슬롯번호는 1부터 시작한다.
            this.slots[iSlot] = ERoomUserSate.Enter;
        }
        else {
            console.log(`[Err] 비어있는 슬롯이 없습니다.`);
            return kPlayer;
        }
        console.log(`[RoomSlot] = ${this.slots},  slot idx = ${iSlot}`);
        this.players.push(kPlayer);
        return kPlayer;
    }
    // Player 삭제
    RemovePlayer(userId) {
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
    FindPlayer(userId) {
        const kPlayer = this.players.find((e) => {
            return e.Name() == userId;
        });
        return kPlayer;
    }
    FirstPlayer() {
        if (this.players.length > 0)
            return this.players[0];
        return undefined;
    }
    // 룸 나간 유저 브로드 캐스팅하기
    SendLeaveRoomPlayer(socket, userId) {
        for (let kPlayer of this.players) {
            if (kPlayer.Id() != userId) {
                let kNotiData = new PacketDatas_1.SNotifyLeaveRoom(this.roomId, kPlayer.Id());
                let packet = kNotiData.SendData();
                socket.write(packet);
            }
        }
    }
    // 슬롯 0으로 초기화하기
    ClearSlot() {
        for (var i = 0; i < this.slots.length; i++) {
            this.slots[i] = 0;
        }
    }
}
exports.Room = Room;
exports.default = Room;
//module.exports = Room;
