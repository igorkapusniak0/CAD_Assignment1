import { Movie, Actor, MovieCast, Award } from "../shared/types";

export const movies: Movie[] = [
  {
    movieId: 1,
    title: "Inception",
    releaseDate: "2010-07-16",
    overview: "A thief who steals information through dreams.",
  },
  {
    movieId: 2,
    title: "The Matrix",
    releaseDate: "1999-03-31",
    overview: "A hacker discovers the reality of his world.",
  },
  {
    movieId: 3,
    title: "Titanic",
    releaseDate: "1997-12-19",
    overview: "A young couple falls in love aboard the ill-fated Titanic.",
  },
  {
    movieId: 4,
    title: "John Wick",
    releaseDate: "2014-10-24",
    overview: "A retired hitman seeks vengeance for his dog.",
  },
  {
    movieId: 5,
    title: "Interstellar",
    releaseDate: "2014-11-07",
    overview: "A team of explorers travel through a wormhole in space.",
  },
];

export const actors: Actor[] = [
  {
    actorId: 1,
    name: "Leonardo DiCaprio",
    bio: "American actor known for Inception, Titanic, The Revenant.",
    dateOfBirth: "1974-11-11",
  },
  {
    actorId: 2,
    name: "Keanu Reeves",
    bio: "Canadian actor known for The Matrix and John Wick.",
    dateOfBirth: "1964-09-02",
  },
  {
    actorId: 3,
    name: "Kate Winslet",
    bio: "British actress known for Titanic, Eternal Sunshine of the Spotless Mind.",
    dateOfBirth: "1975-10-05",
  },
  {
    actorId: 4,
    name: "Matthew McConaughey",
    bio: "American actor known for Interstellar and Dallas Buyers Club.",
    dateOfBirth: "1969-11-04",
  },
  {
    actorId: 5,
    name: "Carrie-Anne Moss",
    bio: "Canadian actress known for The Matrix trilogy and Memento.",
    dateOfBirth: "1967-08-21",
  },
];

export const movieCasts: MovieCast[] = [
  {
    movieId: 1,
    actorId: 1,
    roleName: "Cobb",
    roleDescription: "A thief who enters dreams to steal secrets.",
  },
  {
    movieId: 2,
    actorId: 2,
    roleName: "Neo",
    roleDescription: "The chosen one who awakens from the Matrix.",
  },
  {
    movieId: 3,
    actorId: 3,
    roleName: "Rose DeWitt Bukater",
    roleDescription: "A young woman who falls in love on the Titanic.",
  },
  {
    movieId: 4,
    actorId: 2,
    roleName: "John Wick",
    roleDescription: "A retired hitman seeking vengeance.",
  },
  {
    movieId: 5,
    actorId: 4,
    roleName: "Cooper",
    roleDescription: "A pilot who travels through space to save humanity.",
  },
];

export const awards: Award[] = [
  {
    PK: "m#1",
    awardId: 1,
    body: "Academy Awards",
    category: "Best Visual Effects",
    year: 2011,
  },
  {
    PK: "m#2",
    awardId: 2,
    body: "BAFTA",
    category: "Best Sound",
    year: 2000,
  },
  {
    PK: "a#1",
    awardId: 1,
    body: "Academy Awards",
    category: "Best Male Actor",
    year: 2011,
  },
  {
    PK: "a#3",
    awardId: 3,
    body: "Golden Globe",
    category: "Best Supporting Actress",
    year: 1998,
  },
  {
    PK: "m#5",
    awardId: 4,
    body: "Academy Awards",
    category: "Best Original Score",
    year: 2015,
  },
];
