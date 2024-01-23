//서버에 연결된 유정 기본 정보
export class UserInfo {
    constructor( 
                  public userId:string = "",        // 유저 id
                  public socketId:string ="",     // socket.io에서 지정한 socket id 
                  public ip : string = "",         // 로컬 IP
                  public publicIp : string = "",   // 공용 IP
                  public dataPort: number = 0,    // Data event port
                  public movePort: number = 0)    // 이동 전용 port
    {
      this.userId = userId;
      this.socketId = socketId;
      this.ip = ip;
      this.publicIp = publicIp;
      this.dataPort = dataPort;
      this.movePort = movePort;
    }

    SetInfo( info : UserInfo) : void {
      this.userId = info.userId;
      this.socketId = info.socketId;
      this.ip = info.ip;              
      this.publicIp = info.publicIp; 
      this.dataPort = info.dataPort;
      this.movePort = info.movePort;
    }
  }


 


  export default UserInfo;
  //module.exports = UserInfo;