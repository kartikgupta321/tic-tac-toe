FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

ENTRYPOINT ["sh", "-c"]
CMD ["echo DATABASE_URL=[$DATABASE_URL] && sleep 3600"]