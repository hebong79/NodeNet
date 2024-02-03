"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfo = void 0;
//서버에 연결된 유정 기본 정보
class UserInfo {
    constructor(userId = '', // 유저 id
    //public socketId: string = '', // socket.io에서 지정한 socket id
    ip = '', // 로컬 IP
    publicIp = '', // 공용 IP
    dataPort = 0, // Data event port
    movePort = 0 // 이동 전용 port
    ) {
        this.userId = userId;
        this.ip = ip;
        this.publicIp = publicIp;
        this.dataPort = dataPort;
        this.movePort = movePort;
        this.userId = userId;
        //this.socketId = socketId;
        this.ip = ip;
        this.publicIp = publicIp;
        this.dataPort = dataPort;
        this.movePort = movePort;
    }
    SetInfo(info) {
        this.userId = info.userId;
        //this.socketId = info.socketId;
        this.ip = info.ip;
        this.publicIp = info.publicIp;
        this.dataPort = info.dataPort;
        this.movePort = info.movePort;
    }
    GetPacketSize() {
        let lenUserId = Buffer.byteLength(this.userId, 'utf-8');
        let lenIp = Buffer.byteLength(this.ip, 'utf-8');
        let lenPublicIp = Buffer.byteLength(this.publicIp, 'utf-8');
        return lenUserId + 2 + lenIp + 2 + lenPublicIp + 2 + 4 + 4;
    }
}
exports.UserInfo = UserInfo;
exports.default = UserInfo;
//module.exports = UserInfo;
