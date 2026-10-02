#!/bin/sh
# Best-effort: zaisti, ze lokalny MailHog (docker-compose.yml) bezi pred
# spustenim dev servera, aby overovacie maily (prihlasenie/registracia,
# bod 1.1/2.11) fungovali bez rucneho "docker compose up -d" pri kazdom
# spusteni. Nikdy nezablokuje "next dev", ak Docker nie je dostupny alebo
# sa nestihne spustit vcas - len vypise upozornenie a pokracuje (exit 0).

if ! command -v docker >/dev/null 2>&1; then
  echo "MailHog: Docker nie je nainstalovany, preskakujem (overovacie maily sa v deve nedoruca)."
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "MailHog: Docker Desktop nebezi, spustam..."
  open -a Docker 2>/dev/null

  i=0
  while [ "$i" -lt 20 ]; do
    docker info >/dev/null 2>&1 && break
    sleep 1
    i=$((i + 1))
  done
fi

if docker info >/dev/null 2>&1; then
  docker compose up -d
else
  echo "MailHog: Docker Desktop sa nespustilo vcas, preskakujem (over rucne: docker compose up -d)."
fi

exit 0
