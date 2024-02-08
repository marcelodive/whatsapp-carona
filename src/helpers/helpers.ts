export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const sleepRnd = (min: number = 500, max: number = 1000) => sleep(randomNumber(min, max));

export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;