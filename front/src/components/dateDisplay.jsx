export function DateDisplay(dbTime) {
  const date = new Date(dbTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  });
  return formatter.format(date);
}

export function dataSDisplay(dbTime) {
  const date = new Date(dbTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  });

  return formatter.format(date);
}

export function TimeDisplay(dbTime) {
  const date = new Date(dbTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  });

  return formatter.format(date);
}
