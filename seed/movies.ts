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
];

export const awards: Award[] = [
  {
    awardId: 1,
    body: "Academy Awards",
    category: "Best Visual Effects",
    year: 2011,
  },
  {
    awardId: 2,
    body: "BAFTA",
    category: "Best Sound",
    year: 2000,
  },
];
