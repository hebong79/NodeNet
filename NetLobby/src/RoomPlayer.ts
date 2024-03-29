import net from 'net';
import UserInfo from './UserInfo';
import { SOUser } from './PacketDatas';

//룸 유저 정보
class RoomPlayer {
  isMaster: boolean;
  userState: number;
  slotNo: number;
  isAlive: boolean;
  userInfo: SOUser;

  constructor(isMaster: boolean = false) {
    this.isMaster = isMaster; // 마스터(방장) 클라이언트 여부
    this.userState = 0; //0: ERoomUserSate.Empty(빈슬롯), 1: Enter(룸 입장상태), 2:Ready(게임시작 대기상태)
    this.slotNo = 0; // 룸 슬롯 번호 , 슬롯번호는 1부터 시작한다.
    this.isAlive = true; // 게임중에 살아있는지 여부
    this.userInfo = new SOUser(); // UserInfo 유저 정보(ip, port)
  }

  Id(): string {
    return this.userInfo.userId;
  }
  Name(): string {
    return this.userInfo.userId;
  }

  GetPacketSize(): number {
    let etc = 1 * 2 + 4 * 2; // boolean = 1byte
    return etc + this.userInfo.GetPacketSize();
  }

  GetSocket(): net.Socket | undefined {
    return this.userInfo.socket;
  }

  SetInfo(kPlayer: RoomPlayer) {
    this.isMaster = kPlayer.isMaster;
    this.userState = kPlayer.userState;
    this.slotNo = kPlayer.slotNo;
    this.isAlive = kPlayer.isAlive;
    this.userInfo.SetInfo(kPlayer.userInfo);
  }
}

export default RoomPlayer;

//module.exports = RoomPlayer;
