FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

COPY ./Lila/data/modules/build /nakama/data/modules/build

ENV PORT=7350

CMD ["/bin/sh", "-ecx", "\
echo '=== DEBUG START ===' && \
echo \"DATABASE_URL=$DATABASE_URL\" && \
echo 'Testing DB connection...' && \
/nakama/nakama migrate up --database.address \"$DATABASE_URL\" && \
echo 'MIGRATION OK' && \
exec /nakama/nakama \
--name nakama1 \
--database.address \"$DATABASE_URL\" \
--runtime.path /nakama/data/modules/build \
--logger.level DEBUG"]


