// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: {
      port:8989,
      database:'direktoribisnis',
      user:'postgres',
      password:'postgres',
      host:'127.0.0.1'
    },
    // useNullAsDefault: true,
    // debug: true
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
