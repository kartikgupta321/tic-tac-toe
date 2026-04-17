FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

ENV PORT=7350

CMD ["/nakama/nakama", \
"--name", "nakama1", \
"--database.address", "postgresql://lila_mf2r_user:GOv9pifmyjvawIAYU9JyXDSP1DZCqmwe@dpg-d7h22prbc2fs738nnu7g-a.oregon-postgres.render.com:5432/lila_mf2r?sslmode=require", \
"--logger.level", "DEBUG"]