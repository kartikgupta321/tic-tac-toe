FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

ENV PORT=7350

ENTRYPOINT ["/bin/sh", "-ec"]

CMD ["echo \"DB=$DATABASE_URL\" && \
/nakama/nakama migrate up --database.address \"$DATABASE_URL\" && \
exec /nakama/nakama \
--database.address \"$DATABASE_URL\" \
--logger.level INFO"]