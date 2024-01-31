//const UserInfo = require('./UserInfo');
//const Room = require('./Room');
//const RoomPlayer = require('./RoomPlayer')
//const UserStorage = require('./UserStorage');

//import * as socketIO from 'socket.io';
//import { Socket } from "socket.io";
import net from 'net';
import {Buffer} from 'node:buffer';
import {Socket} from 'net';
import UserInfo from "./UserInfo";
import Room from "./Room";
import { UserStorage } from "./UserStorage";
import RoomPlayer from './RoomPlayer';
import * as PacketDatas from './PacketDatas';

const storage = new UserStorage();  // 저장 리스트 정보

const DLOGIN_SUCCESS = 0;     // 로그인 성공
const DLOGIN_NOT_ID = 1;      // 존재하지 않는 ID
const DLOGIN_WRONG_PASS = 2;  // 패스워드 다름
const DLOGIN_ALREADY_LOGIN = 3; // 이미 로그인중이다.

//룸 상태 
export const ERoomstate = {
  Ready : 0,  // 대기상태 ( 입장가능 )
  Game : 1    // 게임상태 ( 입장불가 )
};

const enum EJoinResult  {
  Success = 0,
  Fail_Room = 1,          // 룸없음
  Fail_Gamming = 2,       // 게임중
  Fail_MaxPlayer = 3,     // 최대플레이어 초과
  Fail_SamePlayer = 4,    // 유저이름이 같은 유저가 접속함
};


// Dictionary 타입 정의
export interface IDictionary<T> {
    [key: string]: T;
}

//
//   로비
//
export class Lobby {
    lobbyUserList : IDictionary<UserInfo>;
    roomList : IDictionary<Room>;
    mClients:net.Socket[] = [];
    mServer?:net.Server = undefined;

    constructor() {
        this.lobbyUserList = {};    // dictioary로 사용, 로비에 접속된 전체 유저 리스트 
        this.roomList = {};         // 룸리스트
    }
    
    // 유저 데이타 초기화 하기 ( 가입유저 파일에서 열기 ) -----------
    Init_UserData() {
        storage.LoadFile();
    }

    // 클라이언트에게 데이터를 브로드캐스트
    Broadcast<T>( client:net.Socket, data:Buffer) {
        if( this.mServer != undefined ) {
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
    
    Receive_CreateId( cleint:net.Socket, data : Buffer) {

        let kData = new PacketDatas.SReqCreateId();
        kData.ReceiveData(data);

        const resUser = storage.FindUserData(kData.userId);
        if( resUser != undefined ){

            let kPacket = new PacketDatas.SAckCreateId(kData.userId, 1);
            kPacket.SendData();

            const packet = {'id':id, 'success': 1, 'socketId':socket.id};   // 이미 가입된 유저임
            cleint.emit("ack_create_id", packet);
            return;
        }
        //유저정보 추가
        storage.PushData(id, pass);
        
        // 파일 저장
        storage.SaveFile();
    
        console.log('<create_id>\n', storage);
        const nRes = 0;
        const packet = {'id':id, 'success': nRes, 'socketId':socket.id};  // 정상 가입됨
        socket.emit("ack_create_id", packet);   

    }
    Receive_Login(  cleint:net.Socket, data : Buffer) {
    }
    Receive_Logout(  cleint:net.Socket, data : Buffer) {
    }
    Receive_UserInfo(  cleint:net.Socket, data : Buffer) {
    }  
    Receive_Withdraw(  cleint:net.Socket, data : Buffer) {
    }
    Receive_InitRoomList(  cleint:net.Socket, data : Buffer) {

    }
    Receive_CreateRoom(  cleint:net.Socket, data : Buffer) {

    }
    Receive_JoinRoom( cleint:net.Socket,  data : Buffer) {

    }
    Receive_RoomReady(  cleint:net.Socket, data : Buffer) {

    }
    Receive_LeaveRoom( cleint:net.Socket,  data : Buffer) {

    }
    Receive_RoomChat(  cleint:net.Socket, data : Buffer) {

    }
    Receive_GameStart( cleint:net.Socket,  data : Buffer) {

    }
    Receive_GameEnd(  cleint:net.Socket, data : Buffer) {

    }
    Receive_Disconnect(  cleint:net.Socket, data : Buffer) {

    }
}

// 계정생성 응답 -----------------------------------------
    Ack_CreateId =(socket:net.Socket, id:string, pass:string )=>{
        const resUser = storage.FindUserData(id);
        if( resUser != undefined ){
            const packet = {'id':id, 'success': 1, 'socketId':socket.id};   // 이미 가입된 유저임
            socket.emit("ack_create_id", packet);
            return;
        }
        //유저정보 추가
        storage.PushData(id, pass);
        
        // 파일 저장
        storage.SaveFile();
    
        console.log('<create_id>\n', storage);
        const nRes = 0;
        const packet = {'id':id, 'success': nRes, 'socketId':socket.id};  // 정상 가입됨
        socket.emit("ack_create_id", packet);   
    };
    // 로그인 응답 -----------------------------------------
    Ack_Login (socket:net.Socket, id:string, pass:string) {
        //조건체크
        const nRes = this.CheckLogin( id, pass); 

        if( nRes == 0 ) 
        console.log(`<login> Login Success ★ ★ ,  ( id : ${id} ) `);
        else
        console.log(`<login> Login Failed ☎ ☎,  code : ${nRes}`);

        // 성공여부 클라이언트에 전송
        const packet = {'id':id, 'success':nRes};
        socket.emit('ack_login', packet);
    }
    // 유저정보 응답 (클라이언트에서 로그인 성공하면 호출해야 됨)----------------
    Ack_LobyUserInfo(socket:net.Socket, data : string ) {
        const info = JSON.parse(data);
            
        // 유저가 존재하는지 체크
        if( (info.id in this.lobbyUserList ) ) {
            return;
        }
        // dataPoat, movePort가 겹치면 +2씩 계속 증가시키기( while문 이용 )
        const list = Object.values(this.lobbyUserList);
        list.sort((a, b)=> (a.dataPort - b.dataPort));
        for( var user of list ) {
            if( user.ip == info.ip || user.publicIp == info.publicIp ) {
                if( user.dataPort == info.dataPort ) 
                    info.dataPort += 1;
                if( user.movePort == info.movePort )
                    info.movePort += 1;
            }
        }
        // 새로운 유저정보 등록
        const newUser = new UserInfo(info.id, "", info.ip, info.publicIp, info.dataPort, info.movePort);
        this.lobbyUserList[info.id] = newUser;

        console.log(`lobbyUserList count = ${Object.keys(this.lobbyUserList).length}\n`);//, lobbyUserList);
    }
    // 로그아웃 응답 ----------------------------------------
    Ack_Logout(socket: net.Socket, id:string) {
        console.log('로그아웃', id, socket.id);
        //clearInterval( socket.interval );
        
        //로그아웃정보를 모든유저에게 보낸다.
        const packet = {'id':id};
        socket.broadcast.emit('notify_logout', packet );

        //목록에서 삭제
        this.LogoutUser(socket, id );
    }
    // 연결해제시 응답 ----------------------------------------
    async Ack_Disconnect(socket:net.Socket) {
        const socketId = socket.id;
        console.log('<disconnect> 클라이언트 접속 해제 : socket id =', socket.id);
        //clearInterval(socket.interval);  // Ping 타이머 해제
        const userId : string = this.FindUserBySocketId(socket.id);
        
        //유저가 룸에 속해있으면 룸에서 삭제
        if( userId != undefined) {
            var kRoom = this.FindRoomByUserId(userId);       // 유저가 속해있는 룸 검색
            if( kRoom != undefined){
                kRoom.RemovePlayer(userId);                 // 룸에서 유저 삭제
                kRoom.SendLeaveRoomPlayer(socket, userId ); // 룸 유저 삭제 - 모든유저에게 전송
        
                if( kRoom.PlayerCount() == 0 ) {
                    kRoom.removedFromList = true;
                    await socket.broadcast.emit('notify_update_roomlist', {'datas': Object.values(this.roomList)});
                    delete this.roomList[kRoom.Name()];
                }
                else {
                    this.SendUpdateRoomList(socket);                 //로비유저의 룸리스트 정보 갱신
                }
            }
        }
        this.LogoutUser(socket, userId );
        //console.log('user count =', Object.keys(this.lobbyUserList).length);
    }
    // 가입탈퇴시 응답 -----------------------------------------
    Ack_Withdraw(socket:net.Socket, id:string) {
        if( storage.RemoveUserData(id) == true)
        storage.SaveFile();

        this.LogoutUser(socket, id);
    }
    // 로그아웃 후 처리 ( param : 유저 id ) ----------------
    LogoutUser(socket:net.Socket, id:string) {
        if( id in this.lobbyUserList ) {
            delete this.lobbyUserList[id];
        }
        console.log('user count =', Object.keys(this.lobbyUserList).length);
    }
    // 로비채팅 응답 --------------------------------------------
    Ack_LobbyChat(socket:net.Socket, userId:string, msg:string) {
        console.log('채팅요청', userId, msg);
      
        //요청에 대한 응답 보내기
        let packet = {userId:userId, msg:msg};
        socket.emit('ack_lobby_chat', packet);
      
        // chat msg를 본인을 제외한 모든유저에게 보낸다.
        socket.broadcast.emit('notify_lobby_chat', packet );
    }
    
    // 룸 리스트 응답 ---------------------------------------
    Ack_InitRoomList(socket:net.Socket, userId:string) {
        console.log("room list count = ", Object.keys(this.roomList).length);
        const packet = {"datas" : Object.values(this.roomList)};
        socket.emit('ack_init_roomlist', packet); 
    }
    // 룸 생성 응답 ----------------------------------------
    Ack_CreateRoom = (socket:net.Socket, roomName:string, userId:string)=>{
        if( !( userId in this.lobbyUserList) ) {
            console.log("create_room.. ", `없는 유저이다. id = ${userId}`);
            return;
        }
        //socket.group(roomName);
        socket.join(roomName);
    
        const room = new Room(roomName, userId);  
        const user = this.lobbyUserList[userId];
        room.Initialize( user );
        
        this.roomList[roomName] = room;
        console.log("create_room.. ", this.roomList[roomName]);
    
        const packet = {"success": 0, "room":room};
        socket.emit("ack_create_room", packet) ;
    
        this.SendUpdateRoomList(socket);
        // var packet2 = {"datas": Object.values(roomList)};
        // socket.broadcast.emit('notify_update_roomlist', packet2);
    };
    // 룸 조인 응답 ----------------------------------------
    Ack_JoinRoom = (socket:net.Socket, roomName:string, userId:string)=>{
    
        //1. 룸이 없어 조인 실패 ( fail code : 1 )
        if( !(roomName in this.roomList)  ) {
            console.log("join_room.. ", `없는 Room이다. name = ${roomName}`);
            const room = new Room(roomName, userId);
            socket.emit("ack_join_room", {"success":1, "room":room});   // 조인 실패
            return;
        }

        const kRoom = this.roomList[roomName];
        
        //2. 게임중이면 접속불가 통지하기 ( fail code : 2 )
        if( kRoom.roomState == ERoomstate.Game){  
            const packet = {"success": 2, "room":kRoom};   
            socket.emit("ack_join_room", packet);
            return;                      
        }
        
        //3. 최대 플레이어 체크하기 ( fail code : 3 )
        if( kRoom.players.length >= kRoom.maxPlayer ){
            const packet = {"success": 3, "room":kRoom};   
            socket.emit("ack_join_room", packet);
            return;                      
        }
        //4. 같은유저 접속 체크 ( fail code : 4 )  
        let kSamePlayer = kRoom.players.find((e)=> ( e.Name() == userId ));
        if( kSamePlayer != undefined ) {
            const packet = {"success": 4, "room":kRoom};   
            socket.emit("ack_join_room", packet);
            return;                      
        }
            
        // 조인성공 
        socket.join(roomName);

        kRoom.removedFromList = false;
        const kUserInfo = this.lobbyUserList[userId];
        const kPlayer = kRoom.AddPlayer( kUserInfo );
    
        //console.log('room list = ', io.adapter.rooms);
        const packet = {"success":0, "room":kRoom};
        socket.emit("ack_join_room", packet);                      // socket 유저에게 룸정보 보내기
        socket.broadcast.to(roomName).emit('notify_enter_room', kPlayer);        // 다른 유저에게 socket user 정보 보내기
        //io.to(roomName).emit('enter_room', kPlayer);        // 모든 유저에게 socket user 정보 보내기
        this.SendUpdateRoomList(socket);
    };
    // 룸 나가기 ------------------------------------------
    async Ack_LeaveRoom(socket:net.Socket, roomName:string, userId:string) {
    
        await socket.broadcast.to(roomName).emit('notify_leave_room', {"id": userId} );
        //io.to(roomName).emit('leave_room', {"id": userId} );
        
        socket.leave(roomName);

        const kRoom : Room = this.roomList[roomName];
        kRoom.RemovePlayer(userId);

        console.log("Leave room user id = ", userId);
        console.log("room player count = ", kRoom.PlayerCount());
        
        //로비에 있는 유저들에게 알림
        if( kRoom.PlayerCount() == 0 ) {
            kRoom.removedFromList = true;
            await socket.broadcast.emit('notify_update_roomlist', {'datas': Object.values(this.roomList)});
            delete this.roomList[roomName];
        }
        else{
            //마스터가 방을 나가면 방장 인계
            if ( kRoom.masterClientId == userId ) {
                let kPlayer = kRoom.FirstPlayer() as RoomPlayer;
                if( kPlayer == undefined ) return;

                kRoom.masterClientId = kPlayer.Name();
                kPlayer.isMaster = true;
                console.log('master id = ', kPlayer.Name());
                const changePacket = {"masterId": kPlayer.Name()};
                await socket.broadcast.to(roomName).emit('notify_room_change_master', changePacket );
            }

            this.SendUpdateRoomList(socket);
        }0
    }
    
    // 룸에서 Ready 상태 응답 --------------------------------
    Ack_RoomUserReady(socket:net.Socket, roomName:string, userId:string, userState:number){
        const kRoom = this.roomList[roomName];
        const kPlayer = kRoom.FindPlayer(userId);
        if( kPlayer != undefined)
            kPlayer.userState = userState;
    
        console.log(userId, 'State : ', userState);
        socket.broadcast.to(roomName).emit('notify_room_ready', {"id": userId,"userState":userState} );
    }

    // 룸내에서 채팅하기 응답 --------------------------------
    Ack_RoomChat(socket:net.Socket, roomName:string, userId:string, msg:string) {
        console.log('룸 채팅요청', userId, msg);
      
        //요청에 대한 응답 보내기
        let packet = {userId:userId, msg:msg};
        socket.emit('ack_room_chat', packet);
      
        // chat msg를 본인을 제외한 모든유저에게 보낸다.
        socket.broadcast.to(roomName).emit('notify_room_chat', packet );
    }
 
    // 게임 시작 ------------------------------------------
    Ack_GameStart(socket:net.Socket, roomName:string, userId:string) {
        console.log('게임시작', '룸 : ', roomName);
        const room = this.roomList[roomName];
        room.roomState = ERoomstate.Game;
        if( room.masterClientId == userId) {
            //io.sockets.in(roomName).emit('notify_game_start', {"start": true} ); // 나를 제외한 룸의 모든 유저에게 보냄
            socket.broadcast.to(roomName).emit('notify_game_start', {"start": true} );  // 나를 제외한 룸의 모든유저에게 보냄
        }
        this.SendUpdateRoomList(socket);
    }
    // 게임 종료 --------------------------------------------
    Ack_GameEnd(socket:net.Socket, roomName:string, userId:string) {
        console.log('게임종료', '룸 : ', roomName);
        const room = this.roomList[roomName];
        room.roomState = ERoomstate.Ready;
        if( room.masterClientId == userId) {
            socket.broadcast.to(roomName).emit('notify_game_End', {"end": true} );  // 나를 제외한 룸의 모든유저에게 보냄
        }
        this.SendUpdateRoomList(socket);
    }

    // 룸리스트 정보 업데이트 하기
    SendUpdateRoomList(server:net.Server, socket:net.Socket) {
        const packet = {"datas": Object.values(this.roomList)};
        socket.broadcast.emit('notify_update_roomlist', packet);
    }
    // 로그인 체크하기 --------------------------------
    CheckLogin(id:string, pass:string) {
        const findUser = storage.FindUserData(id);
    
        // 존재하지 않은 id
        if( findUser == undefined)      return DLOGIN_NOT_ID;
        // 패스워드 다름
        if( findUser.pass != pass )     return DLOGIN_WRONG_PASS;
        // 이미 로그인 중이다.   
        if( findUser.id in this.lobbyUserList )    return DLOGIN_ALREADY_LOGIN;
    
        // 성공
        return DLOGIN_SUCCESS;
    }
    // 유저id로 유저 찾기
    FindUser( userId : string ) {
        if( userId in this.lobbyUserList )
            return this.lobbyUserList[userId];
    
        return undefined;
    }
    // 소켓id로 유저 Id 찾기
    FindUserBySocketId( socketId:string ) {
        const findUser = Object.values(this.lobbyUserList).find( (element, idx) => {
            return (element.socketId == socketId);
        });
        if( findUser != undefined)
            return findUser.userId;
        return "";
    }
    // 룸안에 있는 유저의 룸 찾기
    FindRoomByUserId( userId:string ) {
        for( var key in this.roomList) {
            var kRoom = this.roomList[key];
            var kPlayer = kRoom.FindPlayer(userId);
            if( kPlayer != undefined)
                return kRoom;
        }
        return undefined;
    }
  
}

export default Lobby;
 
//module.exports = Lobby;
