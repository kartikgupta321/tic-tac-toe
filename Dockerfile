FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

ENTRYPOINT ["sh", "-c"]

ENV PORT=7350

CMD ["/bin/sh", "-ec", "\
echo 'DB='\"$DATABASE_URL\" && \
/nakama/nakama migrate up --database.address \"$DATABASE_URL\" && \
exec /nakama/nakama \
--name nakama1 \
--database.address \"$DATABASE_URL\" \
--runtime.path /nakama/data/modules/build \
--logger.level INFO"]