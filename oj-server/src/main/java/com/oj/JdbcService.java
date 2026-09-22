package com.oj;

import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@Service
public class JdbcService {

    private final DataSource dataSource;

    public JdbcService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void testConnection() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            //获取PreparedStatement对象
            PreparedStatement preparedStatement = connection.prepareStatement("select * from products");
            //执行查询
            ResultSet resultSet = preparedStatement.executeQuery();
            //处理结果集
            while (resultSet.next()) {
                int id = resultSet.getInt("id");
                String name = resultSet.getString("name");
                System.out.println("id: " + id + ", name: " + name);
            }
            resultSet.close();
            preparedStatement.close();
        }
    }
}