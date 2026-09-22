package com.oj.securityConfig;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration(proxyBeanMethods = false)
public class DataSourceConfig {

    /**
     * 业务数据库：
     * 用户、题目、提交记录等数据放这里。
     * @Primary 表示没有特别指定时，默认使用它。
     */
    @Primary
    @Bean(name = "businessDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.business")
    public HikariDataSource businessDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }

    /**
     * 判题数据库：
     * 专门执行用户提交的 SQL。
     */
    @Bean(name = "judgeDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.judge")
    public HikariDataSource judgeDataSource() {
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .build();
    }
}