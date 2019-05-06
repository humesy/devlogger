import { Component, OnInit } from '@angular/core';
import { Log } from '../../models/Log';
import { LogService } from '../../services/log.service'
import { AngularFireFunctions } from '@angular/fire/functions';
import { GithubUser, User, GithubRepo, GithubLanguage, GithubLanguagePercentages } from '../../models/github';
import { map, expand, takeWhile, mergeMap, take, catchError, } from 'rxjs/operators';
import { Injectable } from '@angular/core';
//import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
//import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { Observable, from as fromPromise, BehaviorSubject, Subscription, of, forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, Headers, Response } from '@angular/http';
import { AngularFireAuth } from '@angular/fire/auth';
import * as _ from 'lodash';
import { delay } from 'bluebird';
import 'rxjs/add/observable/forkJoin';
import axios from 'axios';
import express from 'express';
import jsonQuery from 'json-query';
import { environment } from '../../../environments/environment'



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
  pass: string;
  private apiBaseURL: string = 'https://api.bitbucket.org/2.0/user';
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
  Obs: Observable<User> = of(null);

  constructor(private logService: LogService,
    private fun: AngularFireFunctions,
    private http: HttpClient) { }

  ngOnInit() {
    // Subscribe to the selectedLog observable
    this.logService.selectedLog.subscribe(log => {
      if (log.id !== null) {
        this.isNew = false;
        this.id = log.id;
        this.text = log.text;
        this.date = log.date;
      }
    });
  }

  onSubmit() {
    //Check if new log
    if (this.isNew) {
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
    let username = "humesy";
    // axios.get('https://cpv2api.com/profile/' + username, {
    // })
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   })
    //let token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLmF1dGgwLmNvbS8iLCJzdWIiOiJhZHw0MDg4NjM5NiIsImF1ZCI6IjZad1pFVW8yWks0YzUwYUxQcGd1cGVnNXYyRmZ4cDlQIiwiaWF0IjoxNTU1NDk2ODQ5LCJleHAiOjE5MTU0OTY4NDl9._MSbAdJ4vXX28TYjrFazHUNSNcuMkj6LaixbLmtsTpQ";
    axios.get("https://api.github.com/repos/humesy/devlogger/stats/commit_activity", {
    })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error)
      })
  }

  private getBitbucketUserEmail(Token) {
    let params = new HttpParams().set('access_token', Token + "==");
    //let headers = new HttpHeaders().set('Authorization', 'Bearer ' + Token)
    return this.http.get('https://api.bitbucket.org/2.0/' + 'user/emails', { params }) //'&key=SlrWOXCGv7Bkypx*yZmQKg((' dev
    //.map((res: Response) => res.json());
  }

  clearState() {
    this.isNew = true;
    this.id = '';
    this.text = '';
    this.date = '';
    this.logService.clearState();
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}