"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStorage = exports.SaveUserData = void 0;
//const file = require("fs");
const fs_1 = __importDefault(require("fs"));
const FILENAME = 'users.json';
// interface ISaveData {
//     (data : SaveUserData) : void;
//     (id:string, pass:string) : void;
// }
// 저장 element 구조 클래스( 참고용 )
class SaveUserData {
    constructor(id = '', pass = '') {
        this.id = id;
        this.pass = pass;
    }
}
exports.SaveUserData = SaveUserData;
//
// 유저 id, pass 저장 리스트
// 함수오버로딩을 위해서는 파라미터 갯수가 같아야 하고 type만 서로 다름.
class UserStorage {
    constructor() {
        this.datas = [];
    }
    // // user data 리스트에 추가하기 (data = {'id':id, 'pass':pass})
    // PushData( data : SaveUserData ) : void {
    //     this.datas.push( data );
    // }
    // user data 리스트에 추가하기
    PushData(id, pass) {
        const data = new SaveUserData(id, pass); // new SaveUserData(id, pass);
        this.datas.push(data);
    }
    // 유저 id로 유저 data 찾기 ( SaveUserData )
    // return : SaveUserData,  undefined
    FindUserData(id) {
        const user = this.datas.find((element) => {
            if (element.id == id)
                return true;
            return false;
        });
        return user;
    }
    // 유저를 찾아 리스트 인덱스 리턴
    // return : datas의 인덱스( 0부터 시작 )
    FindUserDataIndex(id) {
        var index = -1;
        this.datas.find((user, idx) => {
            if (user.id == id) {
                index = idx;
                return true;
            }
            return false;
        });
        return index;
    }
    // 유저 id를 받아 유저 삭제하기
    // return : 성공 -true, 실패 - false
    RemoveUserData(id) {
        var bRes = false;
        var index = this.FindUserDataIndex(id);
        if (index != -1) {
            this.datas.splice(index, 1); // 찾은 유저 삭제
            bRes = true;
        }
        console.log(`Remove User Data: id=${id}, idx=${index}`);
        return bRes;
    }
    // 파일 저장하기 --------------------------------------
    // 주의: nodemon 을 이용하여 실행할때 파일저장을 하면 한번 죽었다가 다시 실행된다.
    //      - 원인 : users.json이 변경되므로 재 컴파일을 해서 생기는 현상
    //      - 해결 : ts-node app.ts로 컴파일 하면 정상 동작한다.
    //              ( nodemon 사용안하거나 저장파일이 컴파일과 무관한곳에 있어야 한다. )
    SaveFile() {
        const storage = { datas: this.datas };
        //storage.datas = this.datas;
        fs_1.default.writeFile(FILENAME, JSON.stringify(storage), (err) => {
            if (err) {
                console.log(err);
                //throw err;
            }
        });
    }
    // 파일 열기 --------------------------------------
    LoadFile() {
        try {
            fs_1.default.readFile(FILENAME, 'utf-8', (err, data) => {
                if (err) {
                    console.log(err);
                }
                else {
                    if (data != '') {
                        var storage = JSON.parse(data);
                        if (storage.hasOwnProperty('datas')) {
                            this.datas = storage.datas;
                        }
                        console.log('<LoadFile>\n', storage);
                    }
                }
            });
        }
        catch (err) {
            console.log(err);
            //throw err;
        }
    }
}
exports.UserStorage = UserStorage;
exports.default = UserStorage;
//module.exports = UserStorage;
