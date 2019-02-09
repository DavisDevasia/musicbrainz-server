# Installing musicbrainz server on AWS (Ubuntu 18.04 LTS)

Launch the instance and connect to the instance via SSH

## Install dependencies
```
sudo apt update
sudo apt upgrade -y

sudo apt-get install git
sudo apt-get install redis-server
sudo apt-get install nodejs

# To install yarn, follow the instructions at: https://yarnpkg.com/en/docs/install#debian-stable
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn

sudo apt-get install build-essential checkinstall bzip2
sudo apt install postgresql-server-dev-10 postgresql-contrib postgresql-10
sudo apt-get install libxml2-dev libpq-dev libexpat1-dev libdb-dev libicu-dev liblocal-lib-perl cpanminus
```
## Clone the source code and build the server and extensions
```
git clone --recursive git://github.com/DavisDevasia/musicbrainz-server.git
cd musicbrainz-server
cp lib/DBDefs.pm.sample lib/DBDefs.pm
```

Open the configuration file in a text editor:
```
nano lib/DBDefs.pm
```
Set `WEB_SERVER` to `{PUBLIC_IP}:5000` and `REPLICATION_TYPE` to `RT_SLAVE`

Compile the server
```
echo 'eval $( perl -Mlocal::lib )' >> ~/.bashrc
source ~/.bashrc
cpanm --installdeps --notest .
yarn install
./script/compile_resources.sh
```
Build postgresql extensions:
We use `checkinstall` instead of `make install` for the added convenience of building a debian package which can be managed better.
```
cd postgresql-musicbrainz-unaccent
make
sudo checkinstall
# replace Name (2) with postgresql-musicbrainz-unaccent
# replace Version (3) current date YYYYMMDD
```
```
cd postgresql-musicbrainz-collate
make
sudo checkinstall
# replace Name (2) with postgresql-musicbrainz-collate
# replace Version (3) current date YYYYMMDD
```

## Configure Postgres
All commands in this section (Configuring Postgres) are to be run as `postgres` user which is created automatically when installing postgres.
Runninng the commands as the default `ubuntu` user will not work.

### Login as postgres user
```
sudo su - postgres
```

### Create a postgres database user for musicbrainz
```
createuser --pwprompt musicbrainz
# enter password when prompted: musicbrainz
```

### Trust all connections from local machine
Open the configuration file
```
nano /etc/postgresql/10/main/pg_hba.conf
```
Enter the following rules on top of existing rules, and save the file.
This matters because Postgres considers only the first entry which matches a criteria.
```
local all all trust
host    all     all     127.0.0.1/32    trust
host    all     all     ::1/128 trust
```

Apply the changes in configuration file:
```
psql
SELECT pg_reload_conf();
Ctrl+D
```

Logout the postgres user by typing: `exit`.

## Setup the database
Download musicbrains dump from ftp://ftp.musicbrainz.org/pub/musicbrainz/data/fullexport/ latest folder
We use `screen` command to make the commands run in background so that they continue even if SSH connection is closed.
```
cd ~
mkdir mbdump
cd mbdump
screen -dm wget http://ftp.musicbrainz.org/pub/musicbrainz/data/fullexport/20190206-001557/mbdump-derived.tar.bz2
screen -dm wget http://ftp.musicbrainz.org/pub/musicbrainz/data/fullexport/20190206-001557/mbdump-editor.tar.bz2
screen -dm wget http://ftp.musicbrainz.org/pub/musicbrainz/data/fullexport/20190206-001557/mbdump.tar.bz2
```

### Quick `screen` tips:
To run a command in screen session: (This will appear like running it normally except that it can be sent to background at anytime by detaching it.)
```
screen <command>
```

To run a command in background: (in detached mode)
```
screen -dm <command>
```

To run a command in background with logging: (Output from command will be saved to a file `screenlog.0`)
```
screen -dmL <command>
```
To see active screen sessions:
```
screen -ls
```

To connect (attach) to a screen session:
```
screen -r <screen-session-id>
# if only one session is currently running, no session id need to be passed
screen -r
```

To detach from an attached screen session:

Type `Ctrl`+`a` and then `d`

## Import dumps to database
I skipped verifying the hash of downloaded files, you may want to verify it.

Import the downloaded dump files to the database:
The following command takes around 30 minutes to complete. Make sure to run it on `screen` to prevent interruptions
```
cd ../musicbrainz-server/
screen -dmL ./admin/InitDb.pl --createdb --import /home/ubuntu/mbdump/mbdump*.tar.bz2 --echo
```

## Run the server
We need to run the server inside a `screen` so that it continues to run even when no SSH connection is active.
The `-S` switch lets us label the screen session so that we can later resume it by `screen -r mbserver`.
```
screen -S mbserver -dm plackup -Ilib
```

We have now succesfully installed musicbrainz-server on our machine.

Go to `http:{PUBLIC_IP}:5000` to verify that the server is running.

But this server will still use musicbrainz server for searching. So we need to install a search server to be a completely independent server.

# INSTALLING SEARCH SERVER

## Install dependencies:
```
sudo apt install openjdk-11-jdk maven tomcat8
```

## Create a `search` home directory
The search server is programmed assuming that it will be installed and indices will be present inside the directory: `/home/search/`.

So we create the directory and change the ownership to `ubuntu` user so that we can directly perform operations on it.

After performing all installation operations, we need to change the ownership to `tomcat8` user so that it can access the indices.

```
cd /home/
sudo mkdir search
sudo chown ubuntu:ubuntu search
```

## Clone the repository and build musicbrainz schema
```
cd /home/search
git clone https://github.com/DavisDevasia/mmd-schema.git
cd mmd-schema/brainz-mmd2-jaxb
screen -dmL mvn install
```

## Clone the repository and build search-server
```
cd /home/search
git clone https://github.com/DavisDevasia/search-server.git
cd search-server
screen -dmL mvn package
```

## Build the search index
Building the search index is a long process and can take hours to complete.
Make sure you run it inside `screen` and let java use available memory using -Xmx switch.
```
cd /home/search
cp search-server/index/target/index-2.0-SNAPSHOT-jar-with-dependencies.jar .
screen -S dl wget http://ftp.freedb.org/pub/freedb/freedb-complete-20181201.tar.bz2
screen -S indexing -dmL java -Xmx4096M -jar index-2.0-SNAPSHOT-jar-with-dependencies.jar --indexes-dir /home/search/indexdata --freedb-dump freedb-complete-20181201.tar.bz2
```

## Configure auto-index updating parameters
Search index can be automatically updated using hourly packets the way musicbrainz db is updated.

Open the configuration file:
```
cd /home/search/search-server/updater/
sudo cp updateindex.cfg.example updateindex.cfg
sudo nano updateindex.cfg
```
Update the file to verify that:
`DB_HOST` is `localhost`, `DB_NAME` is `musicbrainz_db`, `DB_USER` is `musicbrainz`, `DB_PASSWORD` is `musicbrainz`
`INDEXES_DIR` is `/home/search/indexdata` and `SERVLET_HOST` is `http://localhost:8080`

TODO: Setup a cron job to run the updater every hour.

## Change the ownership of `search` directory
The `/home/search` directory must be owned by tomcat user so that there are no permission issues:


Change the ownership:
```
sudo chown -R tomcat8:tomcat8 /home/search
```

## Deploy the built server to tomcat

Stop tomcat service:
```
sudo service tomcat8 stop
```

Extract the built webserver to tomcat's webapp directory:
```
cd /var/lib/tomcat8/webapps
sudo rm -rf ROOT/*
sudo jar -xf /home/search/search-server/servlet/target/searchserver.war
```

Configure Java memory usage and file encoding:
```
sudo nano /etc/default/tomcat8
```
Add `-Xms512M -Xmx512M -Dfile.encoding=UTF-8` to the variable `JAVA_OPTS` and save the file. 512M is the optimum value if that much RAM is available. Don't allocate more than 512M so that search indexing can use the unallocated RAM.

Configure tomcat to enable thread pool and allow UTF-8 encoding.
```
sudo nano /etc/tomcat8/server.xml
```
Change `<Connector port="8080" protocol="HTTP/1.1"connectionTimeout="20000" redirectPort="8443">` 
to `<Connector port="8080" protocol="HTTP/1.1"connectionTimeout="20000" redirectPort="8443" URIEncoding="UTF-8" executor="tomcatThreadPool">`
Uncomment the thread-pool executor and modify attributes.
`<Executor name="tomcatThreadPool" namePrefix="catalina-exec-" maxThreads="150" minSpareThreads="2" minThreads="4"/>`

Save the file.

Start tomcat service:
```
sudo service tomcat8 start
```

# Make musicbrainz server use local search server
We installed the search server on the local machine so that the local musicbrainz server can use it instead of the original musicbrainz search server.

## Update the configuration file to the musicbrainz server
Open the configuration file:
```
cd /home/ubuntu/musicbrainz-server
nano lib/DBDefs.pm
```
Uncomment and set the value of `SEARCH_SERVER` to `localhost:8080` and save the file.

## Restart musicbrainz server

Resume the screen session for the server:
```
screen -r mbserver
```
Enter `Ctrl`+`c` to stop the server.
Start another session:
```
screen -S mbserver -dm plackup -Ilib
```
