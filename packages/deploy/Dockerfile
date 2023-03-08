FROM docker:dind
RUN apk del openssh-client
RUN apk add --update --no-cache openssh
RUN echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
RUN echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
RUN ssh-keygen -A
