FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY ./Lila/data/modules/build /nakama/data/modules/build

ENV PORT=7350

CMD ["/bin/sh", "-c", "env | sort | grep -E 'DATABASE|DB' && sleep 3600"]


