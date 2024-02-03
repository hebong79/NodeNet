"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAckDisconnect = exports.SReqDisconnect = exports.SNotifyGameEnd = exports.SAckGameEnd = exports.SReqGameEnd = exports.SNotifyGameStart = exports.SAckGameStart = exports.SReqGameStart = exports.SNotifyChangeMaster = exports.SNotifyRoomChat = exports.SAckRoomChat = exports.SReqRoomChat = exports.SNotifyRoomUserReady = exports.SAckRoomUserReady = exports.SReqRoomUserReady = exports.SNotifyLeaveRoom = exports.SAckLeaveRoom = exports.SReqLeaveRoom = exports.SNotifyEnterRoom = exports.SAckJoinRoom = exports.SReqJoinRoom = exports.SNotifyUpdateRoomList = exports.SAckCreateRoom = exports.SReqCreateRoom = exports.SAckInitRoomList = exports.SReqInitRoomList = exports.SAckWithdraw = exports.SReqWithdraw = exports.SAckUserInfo = exports.SReqUserInfo = exports.SNotifyLogout = exports.SAckLogout = exports.SReqLogout = exports.SAckLogin = exports.SReqLogin = exports.SAckCreateId = exports.SReqCreateId = exports.SOUserInfoList = exports.SORoom = exports.SORoomPlayer = exports.SOUser = exports.PacketBase = exports.CPacket = exports._PID = exports.EPacket = exports.EUserState = exports.ERoomState = exports.ECreateId = void 0;
const UserInfo_1 = __importDefault(require("./UserInfo"));
const Room_1 = __importDefault(require("./Room"));
const RoomPlayer_1 = __importDefault(require("./RoomPlayer"));
// 계정생성 정보
var ECreateId;
(function (ECreateId) {
    ECreateId[ECreateId["Success"] = 0] = "Success";
    ECreateId[ECreateId["Fail"] = 1] = "Fail";
})(ECreateId || (exports.ECreateId = ECreateId = {}));
// 룸 상태
var ERoomState;
(function (ERoomState) {
    ERoomState[ERoomState["Ready"] = 0] = "Ready";
    ERoomState[ERoomState["Game"] = 1] = "Game";
})(ERoomState || (exports.ERoomState = ERoomState = {}));
// 유저(룸슬롯) 상태
var EUserState;
(function (EUserState) {
    EUserState[EUserState["Empty"] = 0] = "Empty";
    EUserState[EUserState["Enter"] = 1] = "Enter";
    EUserState[EUserState["Ready"] = 2] = "Ready";
})(EUserState || (exports.EUserState = EUserState = {}));
var EPacket;
(function (EPacket) {
    EPacket[EPacket["Req_createId"] = 11001] = "Req_createId";
    EPacket[EPacket["Ack_createId"] = 11002] = "Ack_createId";
    EPacket[EPacket["Req_login"] = 11003] = "Req_login";
    EPacket[EPacket["Ack_login"] = 11004] = "Ack_login";
    EPacket[EPacket["Req_logout"] = 11005] = "Req_logout";
    EPacket[EPacket["Ack_logout"] = 11006] = "Ack_logout";
    EPacket[EPacket["Notify_logout"] = 11007] = "Notify_logout";
    EPacket[EPacket["Req_userInfo"] = 11008] = "Req_userInfo";
    EPacket[EPacket["Ack_userInfo"] = 11009] = "Ack_userInfo";
    EPacket[EPacket["Req_withdraw"] = 11010] = "Req_withdraw";
    EPacket[EPacket["Ack_withdraw"] = 11011] = "Ack_withdraw";
    EPacket[EPacket["Req_init_roomlist"] = 11012] = "Req_init_roomlist";
    EPacket[EPacket["Ack_init_roomlist"] = 11013] = "Ack_init_roomlist";
    EPacket[EPacket["Req_create_room"] = 11014] = "Req_create_room";
    EPacket[EPacket["Ack_create_room"] = 11015] = "Ack_create_room";
    EPacket[EPacket["Notify_update_roomlist"] = 11016] = "Notify_update_roomlist";
    EPacket[EPacket["Req_join_room"] = 11017] = "Req_join_room";
    EPacket[EPacket["Ack_join_room"] = 11018] = "Ack_join_room";
    EPacket[EPacket["Notify_enter_room"] = 11019] = "Notify_enter_room";
    EPacket[EPacket["Req_leave_room"] = 11020] = "Req_leave_room";
    EPacket[EPacket["Ack_leave_room"] = 11021] = "Ack_leave_room";
    EPacket[EPacket["Notify_leave_room"] = 11022] = "Notify_leave_room";
    EPacket[EPacket["Req_room_ready"] = 11023] = "Req_room_ready";
    EPacket[EPacket["Ack_room_ready"] = 11024] = "Ack_room_ready";
    EPacket[EPacket["Notify_room_ready"] = 11025] = "Notify_room_ready";
    EPacket[EPacket["Req_room_chat"] = 11026] = "Req_room_chat";
    EPacket[EPacket["Ack_room_chat"] = 11027] = "Ack_room_chat";
    EPacket[EPacket["Notify_room_chat"] = 11028] = "Notify_room_chat";
    EPacket[EPacket["Notify_change_master"] = 11029] = "Notify_change_master";
    EPacket[EPacket["Req_game_start"] = 11030] = "Req_game_start";
    EPacket[EPacket["Ack_game_start"] = 11031] = "Ack_game_start";
    EPacket[EPacket["Notify_game_start"] = 11032] = "Notify_game_start";
    EPacket[EPacket["Req_game_end"] = 11033] = "Req_game_end";
    EPacket[EPacket["Ack_game_end"] = 11034] = "Ack_game_end";
    EPacket[EPacket["Notify_game_end"] = 11035] = "Notify_game_end";
    EPacket[EPacket["Req_disconnect"] = 11036] = "Req_disconnect";
    EPacket[EPacket["Ack_disconnect"] = 11037] = "Ack_disconnect";
})(EPacket || (exports.EPacket = EPacket = {}));
exports._PID = 0x7e21; // 프리픽스 ID 값 : ~, !
// 레퍼런스 인덱스를 위한 클래스
class RefIdx {
    constructor(value) {
        this.value = value;
    }
}
class CPacket {
    // 버퍼로 부터 문자열 읽기
    // 반환값 : 문자열, 버퍼를 읽을 다음 인덱스
    static readString(data, index) {
        let strSize = data.readIntLE(index.value, 2);
        index.value += 2;
        const strBuf = Buffer.alloc(strSize);
        data.copy(strBuf, 0, index.value, index.value + strSize);
        let str = strBuf.toString('utf-8');
        return str;
    }
    // 버퍼에 문자열 쓰기
    // 반환값: 버퍼에 쓸 다음 인덱스
    static writeString(data, str, index) {
        let strSize = Buffer.byteLength(str, 'utf-8');
        data.writeInt16LE(strSize, index.value);
        index.value += 2;
        data.write(str, 'utf-8');
        index.value += strSize;
        return index.value;
    }
}
exports.CPacket = CPacket;
// 기본비교 PrefixId(2), id(2), size(2), checksum(1)
// size 는 헤더를 제외한 실제 데이터 길이 ( 7byte 제외된 크기 )
// Packet 길이 :  PrefixId(2) + id(2) + length(2) + 실제 data length + checksum(1) = 총길이 : 7 + data길이
class PacketBase {
    constructor(id) {
        this.pid = exports._PID;
        this.id = id;
        this.size = 0;
        this.cheksum = 0;
    }
    // 실제 data Buffer의 시작 인덱스
    getBodyIndex() {
        return 6;
    }
    // 체크섬 포함한 헤더 크기
    getHeaderSize() {
        return 7;
    }
    // 버퍼로 부터 문자열 읽기
    // 반환값 : 문자열, 버퍼를 읽을 다음 인덱스
    readString(data, index) {
        let strSize = data.readIntLE(index.value, 2);
        index.value += 2;
        const strBuf = Buffer.alloc(strSize);
        data.copy(strBuf, 0, index.value, index.value + strSize);
        let str = strBuf.toString('utf-8');
        return str;
    }
    // 버퍼에 문자열 쓰기
    // 반환값: 버퍼에 쓸 다음 인덱스
    writeString(data, str, index) {
        let strSize = Buffer.byteLength(str, 'utf-8');
        data.writeInt16LE(strSize, index.value);
        index.value += 2;
        data.write(str, 'utf-8');
        index.value += strSize;
        return index.value;
    }
    // 헤더부분 Send data
    // 다음버퍼 시작 index를 리턴한다.
    SendDataHeader(data) {
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
exports.PacketBase = PacketBase;
// UserInfo에 통신 함수만 추가한 클래스
class SOUser extends UserInfo_1.default {
    constructor(userId = '', ip = '', publicIp = '', dataPort = 0, movePort = 0) {
        super(userId, ip, publicIp, dataPort, movePort);
        this.socket = undefined;
    }
    // 패킷 크기
    PacketSize() {
        return this.GetPacketSize();
    }
    ReceiveData(data, rIdx) {
        this.userId = CPacket.readString(data, rIdx);
        this.ip = CPacket.readString(data, rIdx);
        this.publicIp = CPacket.readString(data, rIdx);
        this.dataPort = data.readIntLE(rIdx.value, 4);
        rIdx.value += 4;
        this.movePort = data.readIntLE(rIdx.value, 4);
        rIdx.value += 4;
    }
    SendData(data, rIdx) {
        CPacket.writeString(data, this.userId, rIdx);
        CPacket.writeString(data, this.ip, rIdx);
        CPacket.writeString(data, this.publicIp, rIdx);
        data.writeIntLE(this.dataPort, rIdx.value, 4);
        rIdx.value += 4;
        data.writeIntLE(this.movePort, rIdx.value, 4);
        rIdx.value += 4;
    }
}
exports.SOUser = SOUser;
class SORoomPlayer extends RoomPlayer_1.default {
    constructor(isMaster = false) {
        super(isMaster);
    }
    // 패킷 크기
    PacketSize() {
        return this.GetPacketSize();
    }
    ReceiveData(data, rIdx) {
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
    SendData(data, rIdx) {
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
exports.SORoomPlayer = SORoomPlayer;
class SORoom extends Room_1.default {
    constructor(roomId = '', masterClientId = '', maxPlayer = 4) {
        super(roomId, masterClientId, maxPlayer);
    }
    // 패킷 크기
    PacketSize() {
        let lenRoomId = Buffer.byteLength(this.roomId, 'utf-8') + 2;
        let lenMasterClientId = Buffer.byteLength(this.masterClientId, 'utf-8') + 2;
        let etc = 1 + 4 + 1 + this.maxPlayer * 4; // boolean = 1byte
        let playersLen = this.PlayerCount() * this.players[0].GetPacketSize();
        return lenRoomId + lenMasterClientId + etc + playersLen;
    }
    ReceiveData(data, rIdx) {
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
            const kPlayer = new SORoomPlayer();
            kPlayer.ReceiveData(data, rIdx);
            let newPlayer = new RoomPlayer_1.default();
            newPlayer.SetInfo(kPlayer);
            this.players.push(newPlayer);
        }
    }
    SendData(data, rIdx) {
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
exports.SORoom = SORoom;
// 유저 리스트
class SOUserInfoList {
    constructor() {
        this.datas = [];
    }
}
exports.SOUserInfoList = SOUserInfoList;
// 계정생성 요청
class SReqCreateId extends PacketBase {
    constructor(uesrId = '', pass = '') {
        super(EPacket.Req_createId);
        this.userId = uesrId;
        this.pass = pass;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        strSize += 2;
        strSize += Buffer.byteLength(this.pass, 'utf-8');
        strSize += 2;
        return this.getHeaderSize() + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
        this.pass = this.readString(data, rIdx);
    }
    // 보내기 데이타 처리
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        this.writeString(data, this.pass, rIdx);
        return data;
    }
}
exports.SReqCreateId = SReqCreateId;
// 계정생성 응답
class SAckCreateId extends PacketBase {
    constructor(uesrId = '', success = 0) {
        super(EPacket.Ack_createId);
        this.userId = uesrId;
        this.success = success;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 4;
    }
    // 받은 데이타 처리
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
        this.success = data.readIntLE(rIdx.value, 4);
    }
    // 보내기 데이타 처리
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        data.writeIntLE(this.success, rIdx.value, 4);
        return data;
    }
}
exports.SAckCreateId = SAckCreateId;
// 로그인 요청
class SReqLogin extends PacketBase {
    constructor(userId = '', pass = '') {
        super(EPacket.Req_login);
        this.userId = userId;
        this.pass = pass;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        let strSize2 = Buffer.byteLength(this.pass, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
        this.pass = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        this.writeString(data, this.pass, rIdx);
        return data;
    }
}
exports.SReqLogin = SReqLogin;
// 로그인 응답
class SAckLogin extends PacketBase {
    constructor(userId, success) {
        super(EPacket.Ack_login);
        this.userId = userId;
        this.success = success;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 4;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
        this.success = data.readIntLE(rIdx.value, 4);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        data.writeIntLE(this.success, rIdx.value, 4);
        return data;
    }
}
exports.SAckLogin = SAckLogin;
// 로그아웃 요청
class SReqLogout extends PacketBase {
    constructor(userId = '') {
        super(EPacket.Req_logout);
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqLogout = SReqLogout;
// 로그아웃 응답
class SAckLogout extends SReqLogout {
    constructor(userId = '') {
        super(userId);
        this.id = EPacket.Ack_logout;
    }
}
exports.SAckLogout = SAckLogout;
// 로그아웃 통지
class SNotifyLogout extends SReqLogout {
    constructor(userId = '') {
        super(userId);
        this.id = EPacket.Notify_logout;
    }
}
exports.SNotifyLogout = SNotifyLogout;
// 유저정보 요청
class SReqUserInfo extends PacketBase {
    constructor(userInfo) {
        super(EPacket.Req_userInfo);
        this.user = new SOUser();
        if (userInfo != undefined) {
            this.user.SetInfo(userInfo);
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = this.user.PacketSize();
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.user.ReceiveData(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.user.SendData(data, rIdx);
        return data;
    }
}
exports.SReqUserInfo = SReqUserInfo;
// 유저정보 응답
class SAckUserInfo extends PacketBase {
    constructor(userInfo) {
        super(EPacket.Ack_userInfo);
        this.user = new SOUser();
        this.user.SetInfo(userInfo);
    }
    // 패킷 크기
    PacketSize() {
        let size = this.user.PacketSize();
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.user.ReceiveData(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.user.SendData(data, rIdx);
        return data;
    }
}
exports.SAckUserInfo = SAckUserInfo;
// 탈퇴 요청
class SReqWithdraw extends PacketBase {
    constructor(userId = '') {
        super(EPacket.Req_withdraw);
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqWithdraw = SReqWithdraw;
// 탈퇴 응답
class SAckWithdraw extends PacketBase {
    constructor(userId) {
        super(EPacket.Ack_withdraw);
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SAckWithdraw = SAckWithdraw;
// 룸리스트 정보 요청
class SReqInitRoomList extends PacketBase {
    constructor(userId = '') {
        super(EPacket.Req_init_roomlist);
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqInitRoomList = SReqInitRoomList;
// 룸리스트 정보 요청
class SAckInitRoomList extends PacketBase {
    constructor(datas) {
        super(EPacket.Ack_init_roomlist);
        if (datas != undefined) {
            this.datas = datas;
        }
        else {
            this.datas = {};
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = this.getHeaderSize() + 2;
        //const list = Object.values(this.datas);
        for (let key in this.datas) {
            size += this.datas[key].PacketSize();
        }
        return size;
    }
    ReceiveData(data) {
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
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        let list = Object.values(this.datas);
        data.writeIntLE(list.length, rIdx.value, 2);
        for (let kRoom of list) {
            kRoom.SendData(data, rIdx);
        }
        return data;
    }
    RemoveAll() {
        // 객체의 모든 키를 가져와서 각각의 속성을 삭제
        Object.keys(this.datas).forEach((key) => delete this.datas[key]);
    }
}
exports.SAckInitRoomList = SAckInitRoomList;
// 룸 생성 요청
class SReqCreateRoom extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Req_create_room);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqCreateRoom = SReqCreateRoom;
// 룸 생성 응답
class SAckCreateRoom extends PacketBase {
    constructor(success, room) {
        super(EPacket.Req_create_room);
        this.success = success;
        if (room != undefined) {
            this.room = room;
        }
        else {
            this.room = new SORoom();
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = 4;
        size += this.room.PacketSize();
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.success = data.readIntLE(rIdx.value, 4);
        this.room.ReceiveData(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        data.writeIntLE(this.success, rIdx.value, 4);
        this.room.SendData(data, rIdx);
        return data;
    }
}
exports.SAckCreateRoom = SAckCreateRoom;
// 룸 리스트 변경 통지
class SNotifyUpdateRoomList extends PacketBase {
    constructor(datas) {
        super(EPacket.Notify_update_roomlist);
        if (datas != undefined) {
            this.datas = datas;
        }
        else {
            this.datas = {};
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = this.getHeaderSize() + 2;
        //const list = Object.values(this.datas);
        for (let key in this.datas) {
            size += this.datas[key].PacketSize();
        }
        return size;
    }
    ReceiveData(data) {
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
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        let list = Object.values(this.datas);
        data.writeIntLE(list.length, rIdx.value, 2);
        for (let kRoom of list) {
            kRoom.SendData(data, rIdx);
        }
        return data;
    }
    RemoveAll() {
        // 객체의 모든 키를 가져와서 각각의 속성을 삭제
        Object.keys(this.datas).forEach((key) => delete this.datas[key]);
    }
}
exports.SNotifyUpdateRoomList = SNotifyUpdateRoomList;
// 룸 가입 요청
class SReqJoinRoom extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Req_join_room);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqJoinRoom = SReqJoinRoom;
// 룸 가입 응답
class SAckJoinRoom extends PacketBase {
    constructor(success, room) {
        super(EPacket.Ack_join_room);
        this.success = success;
        if (room != undefined) {
            this.room = room;
        }
        else {
            this.room = new SORoom();
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = 4;
        size += this.room.PacketSize();
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.success = data.readIntLE(rIdx.value, 4);
        this.room.ReceiveData(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        data.writeIntLE(this.success, rIdx.value, 4);
        this.room.SendData(data, rIdx);
        return data;
    }
}
exports.SAckJoinRoom = SAckJoinRoom;
// 룸 입장 통지
class SNotifyEnterRoom extends PacketBase {
    constructor(roomPlayer) {
        super(EPacket.Notify_enter_room);
        if (roomPlayer != undefined) {
            this.roomPlayer = roomPlayer;
        }
        else {
            this.roomPlayer = new SORoomPlayer();
        }
    }
    // 패킷 크기
    PacketSize() {
        let size = this.roomPlayer.PacketSize();
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomPlayer.ReceiveData(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.roomPlayer.SendData(data, rIdx);
        return data;
    }
}
exports.SNotifyEnterRoom = SNotifyEnterRoom;
// 룸 나가기 요청
class SReqLeaveRoom extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Req_leave_room);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqLeaveRoom = SReqLeaveRoom;
// 룸 나가기 응답
class SAckLeaveRoom extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Ack_leave_room);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SAckLeaveRoom = SAckLeaveRoom;
// 룸 나가기 통지
class SNotifyLeaveRoom extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Notify_leave_room);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SNotifyLeaveRoom = SNotifyLeaveRoom;
// 룸 Ready 요청
class SReqRoomUserReady extends PacketBase {
    constructor(roomName = '', userId = '', userState = 0) {
        super(EPacket.Req_room_ready);
        this.roomName = roomName;
        this.userId = userId;
        this.userState = userState;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2 + 4;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
        this.userState = data.readIntLE(rIdx.value, 4);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        data.writeIntLE(this.userState, rIdx.value, 4);
        return data;
    }
}
exports.SReqRoomUserReady = SReqRoomUserReady;
// 룸 Ready 응답
class SAckRoomUserReady extends SReqRoomUserReady {
    constructor(roomName = '', userId = '', userState = 0) {
        super(roomName, userId, userState);
        this.id = EPacket.Ack_room_ready;
    }
}
exports.SAckRoomUserReady = SAckRoomUserReady;
// 룸 Ready 통지
class SNotifyRoomUserReady extends SReqRoomUserReady {
    constructor(roomName = '', userId = '', userState = 0) {
        super(roomName, userId, userState);
        this.id = EPacket.Notify_room_ready;
    }
}
exports.SNotifyRoomUserReady = SNotifyRoomUserReady;
// 룸 chatting 요청
class SReqRoomChat extends PacketBase {
    constructor(roomName = '', userId = '', msg = '') {
        super(EPacket.Req_room_chat);
        this.roomName = roomName;
        this.userId = userId;
        this.msg = msg;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        let strSize3 = Buffer.byteLength(this.msg, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2 + 2 + strSize3;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
        this.msg = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        this.writeString(data, this.msg, rIdx);
        return data;
    }
}
exports.SReqRoomChat = SReqRoomChat;
// 룸 chatting 응답
class SAckRoomChat extends SReqRoomChat {
    constructor(roomName = '', userId = '', msg = '') {
        super(roomName, userId, msg);
        this.id = EPacket.Ack_room_chat;
    }
}
exports.SAckRoomChat = SAckRoomChat;
// 룸 chatting 통지
class SNotifyRoomChat extends SReqRoomChat {
    constructor(roomName = '', userId = '', msg = '') {
        super(roomName, userId, msg);
        this.id = EPacket.Notify_room_chat;
    }
}
exports.SNotifyRoomChat = SNotifyRoomChat;
class SNotifyChangeMaster extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Notify_change_master);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SNotifyChangeMaster = SNotifyChangeMaster;
// 게임시작 요청
class SReqGameStart extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Req_game_start);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqGameStart = SReqGameStart;
// 게임시작 응답
class SAckGameStart extends SReqGameStart {
    constructor(roomName = '', userId = '') {
        super(roomName, userId);
        this.id = EPacket.Ack_game_start;
    }
}
exports.SAckGameStart = SAckGameStart;
// 게임시작 통지
class SNotifyGameStart extends PacketBase {
    constructor(start = true) {
        super(EPacket.Notify_game_start);
        this.start = start;
    }
    // 패킷 크기
    PacketSize() {
        let size = 1;
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        let kValue = data.readIntLE(rIdx.value, 1);
        this.start = kValue == 0 ? false : true;
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        data.writeIntLE(this.start ? 1 : 0, rIdx.value, 1);
        return data;
    }
}
exports.SNotifyGameStart = SNotifyGameStart;
// 게임종료 요청
class SReqGameEnd extends PacketBase {
    constructor(roomName = '', userId = '') {
        super(EPacket.Req_game_end);
        this.roomName = roomName;
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.roomName, 'utf-8');
        let strSize2 = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize + 2 + strSize2;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.roomName = this.readString(data, rIdx);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.roomName, rIdx);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqGameEnd = SReqGameEnd;
// 게임종료 응답
class SAckGameEnd extends SReqGameEnd {
    constructor(roomName = '', userId = '') {
        super(roomName, userId);
        this.id = EPacket.Ack_game_end;
    }
}
exports.SAckGameEnd = SAckGameEnd;
// 게임종료 통지
class SNotifyGameEnd extends PacketBase {
    constructor(end = true) {
        super(EPacket.Notify_game_end);
        this.end = end;
    }
    // 패킷 크기
    PacketSize() {
        let size = 1;
        return this.getHeaderSize() + size;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        let kValue = data.readIntLE(rIdx.value, 1);
        this.end = kValue == 0 ? false : true;
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        data.writeIntLE(this.end ? 1 : 0, rIdx.value, 1);
        return data;
    }
}
exports.SNotifyGameEnd = SNotifyGameEnd;
// 네트웍 연결해제 요청
class SReqDisconnect extends PacketBase {
    constructor(userId = '') {
        super(EPacket.Req_disconnect);
        this.userId = userId;
    }
    // 패킷 크기
    PacketSize() {
        let strSize = Buffer.byteLength(this.userId, 'utf-8');
        return this.getHeaderSize() + 2 + strSize;
    }
    ReceiveData(data) {
        let index = this.getBodyIndex();
        let rIdx = new RefIdx(index);
        this.userId = this.readString(data, rIdx);
    }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        let index = this.SendDataHeader(data);
        let rIdx = new RefIdx(index);
        this.writeString(data, this.userId, rIdx);
        return data;
    }
}
exports.SReqDisconnect = SReqDisconnect;
// 네트웍 연결해제 응답
class SAckDisconnect extends PacketBase {
    constructor() {
        super(EPacket.Req_disconnect);
    }
    // 패킷 크기
    PacketSize() {
        return this.getHeaderSize();
    }
    ReceiveData(data) { }
    SendData() {
        let data = Buffer.alloc(this.PacketSize());
        this.SendDataHeader(data);
        return data;
    }
}
exports.SAckDisconnect = SAckDisconnect;
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
