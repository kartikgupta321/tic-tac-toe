FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

CMD ["sh", "-c", "echo DATABASE_URL=[$DATABASE_URL] && sleep 3600"]