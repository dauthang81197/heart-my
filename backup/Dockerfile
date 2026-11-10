# pg_dump 16 khớp với postgres:16 của stack
FROM postgres:16-alpine
RUN apk add --no-cache aws-cli openssl tzdata
COPY backup.sh restore.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh
ENTRYPOINT ["/usr/local/bin/backup.sh"]
CMD ["loop"]
