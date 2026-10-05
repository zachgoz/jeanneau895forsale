export type StagedSpace = {
  spaceId: string;
  title: string;
  stagedId: string;
  unstagedId: string;
  stagedCaption: string;
  unstagedCaption: string;
};

export const STAGED_SPACES: StagedSpace[] = [
  {
    spaceId: "forward-cabin",
    title: "Forward Master Berth",
    stagedId: "forward-cabin-staged",
    unstagedId: "forward-cabin",
    stagedCaption: "Forward master berth · staged with made bedding and pillows",
    unstagedCaption: "Forward master berth · natural cushions & factory layout",
  },
  {
    spaceId: "salon-dinette",
    title: "Salon Dinette & Table",
    stagedId: "salon-dinette-staged",
    unstagedId: "salon-dinette",
    stagedCaption: "Salon dinette · staged with table setting and throw pillows",
    unstagedCaption: "Salon dinette · natural seating cushions & wood table",
  },
  {
    spaceId: "second-cabin",
    title: "Midship Guest Cabin",
    stagedId: "second-cabin-staged",
    unstagedId: "second-cabin",
    stagedCaption: "Second cabin · staged with made bedding and pillows",
    unstagedCaption: "Second cabin · natural double berth cushions",
  },
  {
    spaceId: "enclosed-head",
    title: "Enclosed Head & Vanity",
    stagedId: "enclosed-head-staged",
    unstagedId: "enclosed-head",
    stagedCaption: "Enclosed head · staged with towels and vanity",
    unstagedCaption: "Enclosed head · marine toilet, basin and shower",
  },
];

export const STAGED_PHOTO_MAP: Record<
  string,
  {
    counterpartId: string;
    isStaged: boolean;
    spaceTitle: string;
    counterpartLabel: string;
  }
> = {
  "forward-cabin-staged": {
    counterpartId: "forward-cabin",
    isStaged: true,
    spaceTitle: "Forward Master Cabin",
    counterpartLabel: "Natural Cushions",
  },
  "forward-cabin": {
    counterpartId: "forward-cabin-staged",
    isStaged: false,
    spaceTitle: "Forward Master Cabin",
    counterpartLabel: "Staged View",
  },
  "second-cabin-staged": {
    counterpartId: "second-cabin",
    isStaged: true,
    spaceTitle: "Midship Guest Cabin",
    counterpartLabel: "Natural Cushions",
  },
  "second-cabin": {
    counterpartId: "second-cabin-staged",
    isStaged: false,
    spaceTitle: "Midship Guest Cabin",
    counterpartLabel: "Staged View",
  },
  "salon-dinette-staged": {
    counterpartId: "salon-dinette",
    isStaged: true,
    spaceTitle: "Salon Dinette",
    counterpartLabel: "Natural Table",
  },
  "salon-dinette": {
    counterpartId: "salon-dinette-staged",
    isStaged: false,
    spaceTitle: "Salon Dinette",
    counterpartLabel: "Staged View",
  },
  "enclosed-head-staged": {
    counterpartId: "enclosed-head",
    isStaged: true,
    spaceTitle: "Enclosed Head",
    counterpartLabel: "Natural View",
  },
  "enclosed-head": {
    counterpartId: "enclosed-head-staged",
    isStaged: false,
    spaceTitle: "Enclosed Head",
    counterpartLabel: "Staged View",
  },
};
