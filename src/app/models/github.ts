import { firestore } from 'firebase/app';

export interface GithubUser {
    email: string,
    photoURL?: string,
    accessToken: string,
    loginName: string,
    name?: string,
    uid: string,
    url?: string,
    bio?: string,
    languages?:GithubLanguage[],
    repoCount?: number;
    repoTotal?: number;
  }

  export interface GithubLanguage {
    language?: string,
    show?: boolean,
    score?: number,
  }

  export interface User {
    uid: string;
    email: string;
    photoURL?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    firstNameLower?: string;
    lastNameLower?: string;
    githubApiToken?: string;
    hacker: boolean;
    recruiter: boolean;
    blurb?: string,
    website?: string,
    video?: string,
    phone?: string,
    city?: string,
    state?: string,
    country?: string,
    lat?: number,
    lng?: number,
    location?: firestore.GeoPoint,
    admin?: boolean,
    workHistory?: Job[],
    education?: Education,
    avatarPath?: string,
    preferredAvatar?: string,
    deleteProfile: boolean,
    selectedAvatarURL?: string,
    termsAccepted?: boolean,
    privacyAccepted?: boolean,
    emailShow?: boolean,
    recruiterJob?: RecruiterJob,
    positions?: string[],
    company?: string,
    companyId?: string,
    skills?: string[]
  }

  export interface Job{
    title: string,
    startDate: string,
    endDate: string,
    employer: string,
    description: string,
  }

  export interface Education{
    school: string,
    degree: string,
    grade: string,
    yearCompleted: string,
    description?: string,
  }

  export interface RecruiterJob{
    uid:string,
    company:string,
    creator:string,
    description?:string,
    phone?:string,
    website?:string,
    address?:string,
    lat?:number,
    lng?:number,
    city?:string
    logoPath?:string
  }

  export interface GithubRepo {
    primaryLanguage?: string,
    show?: boolean,
    owner?: boolean,
    name?: string,
    description?: string,
    url?: string,
    visible?: boolean
    contributors?: GithubContributors[],
    commits?: number,
    a?: number,
    c?: number,
    d?: number,
    w?: number,
    commitsArray?: object,
    datesArray?: object
  }

  export interface GithubContributors {
    author: object,
    total: number,
    weeks: GithubContributorsWeeks[]
  }

  export interface GithubContributorsWeeks{
    a: number,
    c: number,
    d: number,
    w: number,
  }

  export interface GithubLanguagePercentages {
    language?: string,
    score?: number,
    uid?: string
  }