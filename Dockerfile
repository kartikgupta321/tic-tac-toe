FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY ./Lila/data/modules/build /nakama/data/modules/build

ENV PORT=7350

CMD ["/bin/sh", "-ecx", "\
/nakama/nakama migrate up --database.address \"$DB_ADDR\" && \
exec /nakama/nakama \
--name nakama1 \
--database.address \"$DB_ADDR\" \
--runtime.path /nakama/data/modules/build \
--logger.level INFO"]