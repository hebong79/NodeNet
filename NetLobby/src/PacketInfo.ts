import UserInfo from './UserInfo';

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

// 기본비교 PrefixId(2), id(2), length(2), checksum(1)
// Packet 길이 :  PrefixId(2) + id(2) + length(2) + 실제 data length + checksum(1) = 총길이 : 5 + data길이

class PacketInfo {

}
class PacketBase {
   pid : number;        // Prefix ID
   id : number;         // Packet ID
   packetSize : number; // Packet Size

   constructor(pid:number, id:number, packetSize:number) {
      this.pid = pid;
      this.id = id;
      this.packetSize = packetSize;
   }
}

export class SOUserInfo {
   pid : number;     // Prefix Id 
   userInfo : UserInfo; 
   
   constructor( pid : number, kUserInfo: UserInfo ) {
     this.pid = pid;
     this.userInfo = new UserInfo();  
     this.userInfo.SetInfo(kUserInfo);
   }
  }
 
 // 유저 리스트
export class SOUserInfoList {
  pid : number;
  datas : SOUserInfo[];
  constructor(pid:number = 0) {
   this.pid = pid;
   this.datas = [];

  }
}

// 계정 생성
export class SOCreateId {
 id : number;  
 success:number;
 constructor(id: number=0, success:number=0) {
   this.id = id;
   this.success = success;
 }
}









export default PacketInfo;






