export const timeout = (time = 0) =>
  new Promise((resolve: Function) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
