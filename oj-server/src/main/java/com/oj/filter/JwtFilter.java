package com.oj.filter;

import com.oj.constant.MessageConstant;
import com.oj.utils.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. 读取请求头
        String authorization = request.getHeader("Authorization");

        // 没带 Bearer Token，交给spring security判断是否允许访问
        if (authorization == null
                || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 去掉 "Bearer " 前缀，得到 JWT 字符串
        String token = authorization.substring(7);
        String role = jwtUtil.parseToken(token).get("role").toString();
        Long userId;
        try {
            // 3. 验证 JWT，并取出用户 ID
            String subject = jwtUtil.parseToken(token).getSubject();
            userId = Long.valueOf(subject);
            if (!"USER".equals(role) && !"ADMIN".equals(role)) {
                throw new IllegalArgumentException(MessageConstant.ROLE_NOT_FOUND);
            }
        } catch (JwtException | IllegalArgumentException e) {
            // Token 无效，结束请求
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);// 401 未授权
            return;
        }

        // 4. 创建认证对象：记录用户 ID
        var authentication = new UsernamePasswordAuthenticationToken(
                userId,     // 当前用户是谁
                null,       // 密码或凭证，这里不保存
                List.of(new SimpleGrantedAuthority("ROLE_" + role))//   // 角色和权限
        );

        // 把身份信息放入 Spring Security 上下文
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);//保存到当前请求线程的 SecurityContextHolder 中

        // 5. 继续执行后面的过滤器
        filterChain.doFilter(request, response);
    }
}