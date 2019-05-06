const axios = require('axios')
//const langList = require('./d.json');

export function Test(data, context, admin) {
  //const admin = require('firebase-admin');
  return new Promise((resolve, reject) => {
    const file = admin.storage().bucket().file("d.json")
    file.download(function (err, contents) {
      if (!err) {
        var jsObject = JSON.parse(contents.toString('utf8'))
        console.log(jsObject);
        resolve();
      }
      else {
        console.log("Error");
        reject();
      }
    })
  })
}

export function BitbucketUpdateHandler(data, context, admin) {
  const db = admin.firestore();
  const uid = data.uid;
  //const login = data.login;
  const accessToken = data.accessToken + "==";
  const scope = data.scope;
  const expire = data.expire;
  const tokenType = data.tokenType;
  let jsObject;

  const file = admin.storage().bucket().file("d.json")
    file.download(function (err, contents) {
      if (!err) {
        jsObject = JSON.parse(contents.toString('utf8'))
      }
      else {
        console.log("Error");
      }
    })

  const userRef = db.doc(`bitbucket/${uid}`);
  //let languages = userRef.languages;
  return new Promise((resolve, reject) => {
    //let check = 0;    //Using to check each update is complete
    axios.get("https://api.bitbucket.org/2.0/user", {
      params: {
        access_token: accessToken
      }
    })
      .then(function (response) {
        const resdata = response.data;
        const repoLink = resdata.links.repositories.href;
        const teamLink = "https://api.bitbucket.org/2.0/teams"
        let newLanguages = [];
        let repoCount = 0;
        let repoTotal = 0;

        //Create bitbucket object
        const UserObject = {
          Token: data.accessToken,
          scopes: scope,
          expires: expire,
          tokenType: tokenType,
          account_id: resdata.account_id,
          created_on: resdata.created_on,
          display_name: resdata.display_name,
          languages: newLanguages,
          is_staff: resdata.is_staff,
          links: resdata.links,
          location: resdata.location,
          repoCount: repoCount,
          repoTotal: repoTotal,
          type: resdata.type,
          username: resdata.username,
          uuid: resdata.uuid,
          website: resdata.website
        }
        userRef.set(UserObject).then(() => {
          //resolve();
        })

        //******* Create bitbucket repo list *******//
        let repoPromise = new Promise((resolve, reject) => {
          axios.get(repoLink, {
            params: {
              access_token: accessToken
            }
          })
            .then(function (response) {
              const repoData = response.data.values;
              for (let i = 0; i < repoData.length; i++) {
                repoCount++
                repoTotal++
                const repoRef = db.doc(`bitbucket/${uid}/repos/${repoData[i].slug}`);
                let language
                if (repoData[i].language == "") {
                  language = "Unknown"
                }
                else {
                  language = repoData[i].language
                }
                const BitbucketRepo = {
                  created_on: repoData[i].created_on,
                  description: repoData[i].description,
                  fork_policy: repoData[i].fork_policy,
                  full_name: repoData[i].full_name,
                  has_issues: repoData[i].has_issues,
                  has_wiki: repoData[i].has_wiki,
                  is_private: repoData[i].is_private,
                  language: language,
                  links: repoData[i].links,
                  mainbranch: repoData[i].mainbranch,
                  name: repoData[i].name,
                  owner: repoData[i].owner,
                  scm: repoData[i].scm,
                  size: repoData[i].size,
                  show: true,
                  slug: repoData[i].slug,
                  type: repoData[i].type,
                  updated_on: repoData[i].updated_on,
                  uuid: repoData[i].uuid,
                  website: repoData[i].website
                }
                repoRef.set(BitbucketRepo).then(() => {
                })
              }
              BitbucketLanguageHandler(data, admin, repoData, jsObject);
              resolve();
            })
            .catch(function (error) {
              console.log(error);
              reject(error);
            })
        })
        //******* End bitbucket repo list *******//

        //******* Create bitbucket team list *******//
        repoPromise.then(() => {
          let teamPromise = new Promise((resolve, reject) => {
            axios.get(teamLink, {
              params: {
                access_token: accessToken,
                role: 'contributor'
              }
            })
              .then(function (response) {
                const teamData = response.data.values;
                for (let i = 0; i < teamData.length; i++) {
                  axios.get(teamLink + '/' + teamData[i].username + '/repositories', {
                    params: {
                      access_token: accessToken
                    }
                  })
                    .then(function (response) {
                      const teamRepos = response.data.values;
                      for (let j = 0; j < teamRepos.length; j++) {
                        const teamRepoRef = db.doc(`bitbucket/${uid}/repos/${teamRepos[j].slug}`)
                        let language
                        if (teamRepos[j].language == "") {
                          language = "Unknown"
                        }
                        else {
                          language = teamRepos[j].language
                        }

                        const bitbucketTeamRepos = {
                          created_on: teamRepos[j].created_on,
                          description: teamRepos[j].description,
                          fork_policy: teamRepos[j].fork_policy,
                          full_name: teamRepos[j].full_name,
                          has_issues: teamRepos[j].has_issues,
                          has_wiki: teamRepos[j].has_wiki,
                          is_private: teamRepos[j].is_private,
                          language: language,
                          links: teamRepos[j].links,
                          mainbranch: teamRepos[j].mainbranch,
                          name: teamRepos[j].name,
                          owner: teamRepos[j].owner,
                          project: teamRepos[j].owner,
                          scm: teamRepos[j].scm,
                          size: teamRepos[j].size,
                          show: true,
                          slug: teamRepos[j].slug,
                          type: teamRepos[j].type,
                          updated_on: teamRepos[j].updated_on,
                          uuid: teamRepos[j].uuid,
                          website: teamRepos[j].website
                        }
                        repoCount++;
                        repoTotal++;

                        teamRepoRef.set(bitbucketTeamRepos).then(() => {
                        })
                      }

                      const userRefTeam = db.doc(`bitbucket/${uid}/teams/${teamData[i].username}`)
                      const bitbucketTeams = {
                        created_on: teamData[i].created_on,
                        display_name: teamData[i].display_name,
                        links: teamData[i].links,
                        location: teamData[i].location,
                        type: teamData[i].type,
                        username: teamData[i].username,
                        uuid: teamData[i].uuid,
                        website: teamData[i].website,
                        show: true
                      }
                      userRefTeam.set(bitbucketTeams).then(() => {
                        resolve();
                      })

                    })
                    .catch(function (error) {
                      console.log(error);
                    })
                }
              })
              .catch(function (error) {
                console.log(error);
                reject(error);
              })
            //******* End bitbucket team list *******//
          })

          //******* Update language percentage *******//
          teamPromise.then(() => {
            let languagePromise = new Promise((resolve, reject) => {
              userRef.get().then(function (doc) {
                if (doc.exists) {
                  let langList = doc.data().languages;
                  if (langList != null) {
                    let data1 = [['Language', '%']];
                    let percentageData = [];
                    let languageTotal = 0;
                    for (let i = 0; i < langList.length; i++) {
                      if (langList[i].show) {
                        data1.push([langList[i].language.toLowerCase(), langList[i].score.toString()]);
                        languageTotal += langList[i].score;
                      }
                    }
                    for (let j = 1; j < data1.length; j++) {//(let j=1; j<this.data1.length-1;j++){
                      percentageData.push([data1[j][0], (Number(data1[j][1]) / languageTotal)])
                    }
                    const ref = db.doc(`users/${uid}`)
                    ref.get().then(function (doc) {
                      if (doc.exists) {
                        let user = doc.data();
                        let lat: number
                        let long: number
                        if (user.location != null) {
                          lat = user.location.latitude
                          long = user.location.longitude
                        }
                        else {
                          lat = 0
                          long = 0
                        }

                        const locationData = new admin.firestore.GeoPoint(lat, long)
                        const languagePath = `bitbucketLanguages/${uid}`;
                        let data = {}

                        for (let i = 0; i < percentageData.length; i++) {
                          const name = percentageData[i][0]
                          const score = percentageData[i][1]
                          if (i == 0) {
                            if (user.location != null) {
                              data['location'] = locationData
                            }
                            data['uid'] = uid
                          }
                          data[name] = score
                        }
                        const langRef = db.doc(languagePath);
                        langRef.set(data)
                        resolve();
                      }
                    })
                  }
                }
              })
              //******* End language percentage *******//
            })

            languagePromise.then(() => {
              userRef.update({ repoCount: repoCount });
              userRef.update({ repoTotal: repoTotal });
              resolve();
            })
          })
        })
      })
      .catch(function (error) {
        console.log(error);
        reject(error);
      });
  });
}

async function BitbucketLanguageHandler(data, admin, repos, langList) {
  const db = admin.firestore();
  const userRef = db.doc(`bitbucket/${data.uid}`);
  const files = new Array();
  const repoRefs = new Array();
  for (let z = 0; z < repos.length; z++) {
    repoRefs.push(repos[z].links.source.href);
  }
  let url = repoRefs.pop();

  while (url) {
    let info: RepoData = await axiosRequest(url, data.accessToken);
    for (let i = 0; i < info.values.length; i++) {
      if (info.values[i].attributes) {
        var fileData = {
          name: info.values[i].path,
          size: info.values[i].size
        }
        files.push(fileData)
        files.push(fileData)
      }
    }
    if (info.next) {
      url = info.next;
    }
    else {
      if (repoRefs.length > 0) {
        url = repoRefs.pop();
      }
      else {
        url = null;
      }
    }
  }

  const languageInfo = new Array();
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    let lang = checkLanguage(files[i].name, langList);
    if (lang != null) {
      totalSize += files[i].size;
      let pos = checkLangExist(languageInfo, lang);
      if (pos >= 0) {
        languageInfo[pos].score += files[i].size;
      }
      else {
        let newLang = {
          language: lang,
          score: files[i].size
        }
        languageInfo.push(newLang);
      }
    }
  }

  for (let i = 0; i < languageInfo.length; i++) {
    let percentage = languageInfo[i].score / totalSize * 100;
    percentage = +percentage.toFixed(2);
    languageInfo[i].score = percentage;
  }
  userRef.update({ languages: languageInfo })
}

function checkLangExist(list, lang) {
  for (let x = 0; x < list.length; x++) {
    if (list[x].language === lang) {
      return x;
    }
  }
  return -1;
}

export interface RepoData {
  next?: string,
  page?: number,
  pageLen?: number,
  values?: any[]
}

async function axiosRequest(url, accessToken) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params: {
        access_token: accessToken + "==",
        max_depth: "9999999999999",
        pagelen: "100"
      }
    })
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        console.log("Error:" + error);
        reject(error)
      });
  })
}

function checkLanguage(path, langList) {
  let split = path.split('.');
  let file = "." + split[split.length - 1];
  let lang;
  if (langList[file]) {
    lang = langList[file].lang;
  }
  else {
    lang = null;
  }
  return lang;

}