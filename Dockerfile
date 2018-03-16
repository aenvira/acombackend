FROM node:8
RUN mkdir -p /server
WORKDIR /server
COPY . /server
RUN npm install
CMD [ "npm", "start" ]
EXPOSE 3000
