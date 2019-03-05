import { Component, OnInit } from '@angular/core';
import { Log } from '../../models/Log';
import { LogService } from '../../services/log.service'
import { AngularFireFunctions } from '@angular/fire/functions';
import { GithubUser, User, GithubRepo, GithubLanguage, GithubLanguagePercentages } from '../../models/github';
import {map,  expand, takeWhile, mergeMap, take, catchError,} from 'rxjs/operators';
import { Injectable } from '@angular/core';
//import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
//import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { Observable ,  from as fromPromise , BehaviorSubject,  Subscription ,  of, forkJoin } from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Http, Headers, RequestOptions} from '@angular/http';
import { AngularFireAuth } from '@angular/fire/auth';
import * as _ from 'lodash';
import { delay } from 'bluebird';
import 'rxjs/add/observable/forkJoin';


@Component({
  selector: 'app-log-form',
  templateUrl: './log-form.component.html',
  styleUrls: ['./log-form.component.css']
})
export class LogFormComponent implements OnInit {
  id: string;
  text: string;
  date: any;
  scrong: string;
  private apiBaseURL: string = "https://api.github.com";
  isNew: boolean = true;
  githubRepos: GithubRepo[] = [];
  repoSub: Subscription;
  private repoLoaded: boolean = false;
  languageSub: Subscription;
  githubLanguages: any;
  userObs: Observable<GithubUser> = of(null);
  currentUser: BehaviorSubject<GithubUser> = new BehaviorSubject(null);
  private userLoaded: boolean = false;
  reposObs: Observable<GithubRepo[]> = of(null);
  private repoCollection: AngularFirestoreCollection<GithubRepo>;
  currentRepos: BehaviorSubject<GithubRepo[]> = new BehaviorSubject(null);
  private http: HttpClient;
  Obs: Observable<User> = of(null);

  constructor(private logService: LogService, 
    private fun: AngularFireFunctions,
    private afs: AngularFirestore,
    private _http: Http,) { }

  ngOnInit() {
    // Subscribe to the selectedLog observable
    this.logService.selectedLog.subscribe(log => {
      if(log.id !== null) {
        this.isNew = false;
        this.id = log.id;
        this.text = log.text;
        this.date = log.date;
      }
    });
  }

  onSubmit() {
    //Check if new log
    if(this.isNew) {
      const newLog = {
        id: this.generateId(),
        text: this.text,
        date: new Date()
      }
      this.logService.addLog(newLog);
    }
    else {
      const updLog = {
        id: this.id,
        text: this.text,
        date: new Date()
      }
      this.logService.updateLog(updLog);
    }

    this.clearState();
  }

  testFunction() {
    var uid = this.scrong;
    //this.fun.httpsCallable('AddUserToPosition')(apply).toPromise();
    this.signInUpdate("humesy", uid, "fa35728ec1969f9d6cc5363913520c17cc7c2123")
    this.scrong = "";
  }

  clearState() {
    this.isNew = true;
    this.id = '';
    this.text = '';
    this.date = '';
    this.logService.clearState();
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
  }

  //OK HERE WE GO
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  signInUpdate(login: string, uid: string, accessToken: string): void {
    //initialise firestore document
    const userRef: AngularFirestoreDocument<GithubUser> = this.afs.doc<GithubUser>(`github/${uid}`);
    this.afs.doc<GithubUser>(`github/${uid}`).valueChanges().pipe(take(1)).subscribe(doc => {
      if (!doc) {
        //If there is no doc initialise from github API
        console.log("DOC NOT Found");
        this.createGithubUser(uid, accessToken);
        
      }
        //Else just update the access token
      else{
        console.log("DOC Found");
        //userRef.update({accessToken: accessToken});
        this.getGithubUserInfo(accessToken).subscribe(githubData => {
          if(githubData){
            const userAvatar ={
              photoURL: githubData.avatar_url
            }
            this.afs.doc<User>(`users/${uid}`).update(userAvatar).then(()=>{
            this.updateRepos(login, accessToken, uid);
            })
          } 
        })
        let repoFound=false;
        setTimeout(() =>{
          this.repoSub = this.getRepos(uid).pipe(take(1)).subscribe(repos => {
            if(repos){
              this.githubRepos = repos;
              repoFound = true
              this.updateRepoStats(login, accessToken, uid)
            }
          })
        }, 4000)
        let languageFound=false;
        this.languageSub = this.getUser(uid).subscribe(user => {
          if(user){
            this.githubLanguages = user.languages;
            //console.log(this.githubLanguages)
            languageFound=true;
            
          }
        })
        if(this.githubLanguages!=null){
          this.languageSub.unsubscribe()
        }
      }
      //initialise user the same way as the constructor does
      this.userObs = this.afs.doc<GithubUser>(`github/${uid}`).valueChanges();
      this.userObs.subscribe(this.currentUser);
      this.initRepos(uid);
    });
  }

  getUser(uid: string): BehaviorSubject<GithubUser>{
    if (!this.userLoaded){
      this.userObs = this.afs.doc<GithubUser>(`github/${uid}`).valueChanges();
      this.userObs.subscribe(this.currentUser);
      this.userLoaded = true;
    }
    return this.currentUser;
  }

  createGithubUser(uid: string, accessToken: string){
    const userRef: AngularFirestoreDocument<GithubUser> = this.afs.doc<GithubUser>(`github/${uid}`);
    this.getGithubUserInfo(accessToken).subscribe(githubData => {
      //Setup github user
      if(githubData){
        const githubUser: GithubUser = {
          loginName: githubData.login,
          email: githubData.email,
          accessToken: accessToken,
          uid: uid,
          url: githubData.html_url,
          bio: githubData.bio,
          photoURL: githubData.avatar_url
        };
        const userAvatar ={
          photoURL: githubData.avatar_url
        }
        this.afs.doc<User>(`users/${uid}`).update(userAvatar)
        userRef.set(githubUser).then(() => {
          this.updateRepos(githubUser.loginName, accessToken, uid)

          setTimeout(() =>{
            this.repoSub = this.getRepos(uid).pipe(take(1)).subscribe(repos => {
              if(repos){
                //console.log(repos)
                this.githubRepos = repos;
                this.updateRepoStats(githubUser.loginName, accessToken, uid)
              }
            })
          },4000)
          
        })
      }
    });
    
  }

  private initRepos(userID: string){
    const uid = userID;
    const repoLocation = `github/${uid}/repos`;
    this.repoCollection = this.afs.collection<GithubRepo>(repoLocation, ref => {
      return ref.orderBy('__name__')  //Alphabetically order repos.
    });
    this.reposObs = this.repoCollection.valueChanges();
    this.reposObs.subscribe(this.currentRepos);
  }

  updateRepos(login: string, accessToken: string, uid: string){
    //Get Repo data and add to firebase database
    const userRef: AngularFirestoreDocument<GithubUser> = this.afs.doc<GithubUser>(`github/${uid}`);
    const languagesUrls: string[] = [];
    let repoCount = 0;
    let repoTotal = 0;
    let Requests = []       
    this.getGithubRepos(accessToken).subscribe(repoData => {
      if(repoData){
      this.githubRepos.forEach(repo => {
        let RepoExist=false
          for(let k=0; k<repoData.length; k++){
            if(repo.name==repoData[k].name){
              RepoExist=true
            }
          }
          if(RepoExist==true){
            let targetURL = this.apiBaseURL+"/repos/"+repo.url.split("/")[3]+"/"+repo.url.split("/")[4]+"/stats/contributors"
            Requests.push(this.http.get(targetURL+ '?access_token=' + accessToken));
          }
          if(RepoExist==false){
            //console.log("Deleting: "+this.githubRepos[j].name)
            const doc = `github/${uid}/repos/${repo.name}`;
            this.afs.doc(doc).delete()
            .then((res) => {
            })
            .catch(error => this.handleError(error) ); 
          }
        });
      
      repoData.forEach(repo => {
        const repoPath = `github/${uid}/repos/${repo.name}`;
        const repoDoc = this.afs.doc<GithubRepo>(repoPath);
        repoTotal++
        let position = null
        if(this.githubRepos != null){
          let length = this.githubRepos.length
          for(let i=0; i<length; i++){
            if(this.githubRepos[i].name == repo.name){
              position = i;
              break;
            }
          }
        }

        const newRepo: GithubRepo = {};
        newRepo.primaryLanguage = repo.language;
        if(position != null){
          newRepo.show = this.githubRepos[position].show
        }
        else{
          newRepo.show = !repo.private;
        }
        if(newRepo.show==true){
          repoCount++
        }
        newRepo.name = repo.name;
        newRepo.description = repo.description;
        newRepo.url = repo.html_url;

        if((!repo.fork) && (repo.owner.login == login)){
          newRepo.owner = true
        } else {
          newRepo.owner = false
        }
        
        if (newRepo.owner){
          languagesUrls.push(repo.languages_url);
        }
       
        repoDoc.set(newRepo);
      });
      this.afs.doc<GithubUser>(`github/${uid}`).update({repoTotal, repoCount});
      this.updateLanguages_v2(accessToken, uid, languagesUrls);
      return
    }
    return
    }
  ,err => {
    console.log(err['status'])
    console.log('Error Code: '+err['status'])
    console.log('Please reconnect your Github account')
    //this.unlinkGithub()
    //this.deleteGithubData(uid)
  }
  );
  return
  }

  private handleError(error) {
    //console.error(error)
    console.log(error.message)
  }

  async updateRepoStats(login: string, accessToken: string, uid: string){
    //Get Repo data and add to firebase database
    let Requests = []       
    this.githubRepos.forEach(repo => {
      let targetURL = this.apiBaseURL+"/repos/"+repo.url.split("/")[3]+"/"+repo.url.split("/")[4]+"/stats/contributors"
      Requests.push(this.http.get(targetURL+ '?access_token=' + accessToken).pipe(catchError(e => of('Oops!'))));
    });

    this.getMultipleGithubRepoStats(Requests).subscribe(responses =>{
      if(responses){
        //console.log(responses)
        for(let i=0; i<responses.length; i++){
          //console.log(responses[i])
          const repoPath = `github/${uid}/repos/${this.githubRepos[i].url.split("/")[4]}`;
          const repoDoc = this.afs.doc<GithubRepo>(repoPath);
          repoDoc.update({'contributors': responses[i]})
        }
        return
      }
    })
    return
  }

  getRepos(uid: string): BehaviorSubject<GithubRepo[]>{
    //If current repos is currently null pull data from firebase
    if (!this.repoLoaded)
    {
      const repoLocation = `github/${uid}/repos`;
      this.repoCollection = this.afs.collection<GithubRepo>(repoLocation, ref => {
        return ref.orderBy('__name__')  //Alphabetically order repos.
      });
      this.reposObs = this.repoCollection.valueChanges();
      this.reposObs.subscribe(this.currentRepos);
      this.repoLoaded = true;
    }
    return this.currentRepos;
  }

  updateLanguages_v2 (accessToken: string, uid: string, languagesUrls: string[]){
    const userRef: AngularFirestoreDocument<GithubUser> = this.afs.doc<GithubUser>(`github/${uid}`);
    const newLanguages: GithubLanguage[]  = [];
    let languageResponses: any[]=[];
    //create http response array for all language URLS and map to JSON
    languagesUrls.forEach(languagesUrl => {
      languageResponses.push(this._http.get(languagesUrl).pipe(map(res => res.json())));
    });

    //Get Langauge data all at once
    forkJoin(languageResponses).subscribe(languageData =>{
      languageData.forEach(langs => {
          if(langs){
          var keyFound: boolean = false;
          for (var key in langs) {
            let position = null
            if(this.githubLanguages != null){
              let length = this.githubLanguages.length
              for(let i=0; i<length; i++){
                if(this.githubLanguages[i].language == key){
                  position = i;
                  break;
                }
              }
            }
            //Check if lanaguge is already in array
            for (let c=0; c < newLanguages.length; c++){
              if (key === newLanguages[c].language){
                newLanguages[c].score += langs[key];
                keyFound = true;
                break;
              }
            }
            //If not in array then add to array
            if (!keyFound || newLanguages.length === 0){ 
              if(position != null){
                //console.log(this.githubLanguages[position].show)
                const NextLanguage: GithubLanguage = {
                  language: key,
                  score: Number(langs[key]),
                  show: this.githubLanguages[position].show,
                };
                newLanguages.push(NextLanguage);
              }
              else{
                const NextLanguage: GithubLanguage = {
                  language: key,
                  score: Number(langs[key]),
                  show: true,
                };
                newLanguages.push(NextLanguage);
              }
            }
          }
          keyFound = false;
          userRef.update({languages: newLanguages}); //Add languages to user.
        }      
      });
      this.updateLanguagePercentages(uid)
    });
  }

  updateLanguagePercentages(uid){
    this.userObs = this.afs.doc<GithubUser>(`github/${uid}`).valueChanges().pipe(take(1));
    this.userObs.subscribe(githubUser =>{
      if(githubUser){
        if(githubUser.languages){
          let data1 = [['Language', '%']];
        let percentageData=[];
        let languageTotal = 0;
        for (let i=0; i < githubUser.languages.length; i++){
          if(githubUser.languages[i].show){
            data1.push([githubUser.languages[i].language.toLowerCase(),githubUser.languages[i].score.toString()]);
            languageTotal += githubUser.languages[i].score;
          }
        }
        for (let j=1; j<data1.length;j++){//(let j=1; j<this.data1.length-1;j++){
          percentageData.push([data1[j][0],(Number(data1[j][1])/languageTotal)])
        }
        
        this.Obs = this.afs.doc<User>(`users/${uid}`).valueChanges();
        let lat: number,long:number
        this.Obs.subscribe(user =>{
          if(user){
            if(user.location != null){
              lat = user.location.latitude
              long = user.location.longitude
            }
            else{
              lat = 0
              long = 0
            }
            const locationData = new firebase.firestore.GeoPoint(lat, long)
            const languagePath = `githubLanguages/${uid}`;
            let data = {}
            for(let i=0; i<percentageData.length; i++){
              const name = percentageData[i][0]
              const score =  percentageData[i][1]
              if(i==0){
                if(user.location != null){
                  data['location'] = locationData
                }
                data['uid'] = uid
              }
              data[name] = score
            }
            this.afs.doc(languagePath).set(data)
          }
        })
      }
    }
       
    })
  }

  private getGithubRepos(accessToken){
    return this._http.get(this.apiBaseURL + '/user/repos?access_token=' + accessToken).pipe(
      map(res => res.json()));
  }

  private getGithubUserInfo(accessToken) {
    return this._http.get(this.apiBaseURL + '/user?access_token=' + accessToken).pipe(
      map(res => res.json()));
  }

  private getMultipleGithubRepoStats(Requests): Observable<any[]>{
    return Observable.forkJoin(Requests)
  }
}
