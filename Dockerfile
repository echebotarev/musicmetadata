FROM node:8

ARG PATH=false

MAINTAINER Egor Chebotarev "eg.chebotarev@gmail.com"

# Update aptitude with new repo
RUN apt-get update

# Install software
RUN apt-get install -y git

COPY . .

RUN git clone https://github.com/echebotarev/musicmetadata.git
RUN cd musicmetadata && npm install

WORKDIR .

CMD [ "npm", "start", "${PATH}" ]
