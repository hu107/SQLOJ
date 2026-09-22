package com.oj.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expiration;

    // Spring 创建这个对象时，从配置中读取密钥和有效期
    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration) {

        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );
        this.expiration = expiration;
    }



    // 生成令牌
    public  String generateToken(Long userId) {
        // 获取当前时间，单位是毫秒
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())      // 记录这个令牌属于谁，用户ID为1，就保存字符串"1"
                .issuedAt(new Date(now))       // 设置签发时间
                .expiration(new Date(now + expiration))  // 设置过期时间：现在 + 有效时长
                .signWith(secretKey, Jwts.SIG.HS256)     // 使用密钥和 HS256 算法签名，供后续验证令牌是否被篡改
                .compact();     // 完成构建，生成最终的 JWT 字符串
    }

    // 验证签名、检查有效期，并取出令牌中的数据
    public Claims parseToken(String token) {
        return Jwts.parser()               // 创建 JWT 解析器
                .verifyWith(secretKey)     // 用secretKey验证签名
                .build()     // 构建解析器
                .parseSignedClaims(token)     // 解析 JWT 令牌，如果令牌无效，会抛出异常
                .getPayload();     // 获取解析后的负载，即令牌中的数据
    }
}