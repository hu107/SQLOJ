package com.oj.securityConfig;

import com.oj.filter.JwtFilter;
import com.oj.utils.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtUtil jwtUtil) throws Exception {

        http
                // 当前通过 Authorization 请求头携带 JWT 认证
                .csrf(AbstractHttpConfigurer::disable)

                // 不使用默认登录页面、Basic 认证和默认退出接口
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)

                // 不通过 Session 保存登录状态，每次请求都验证 Token，无状态认证
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .requestCache(AbstractHttpConfigurer::disable)// 禁用请求缓存

                // 设置哪些接口需要登录
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                HttpMethod.POST,
                                "/login",
                                "/register"
                        ).permitAll()
                        .anyRequest().authenticated()// 其他接口都需要登录
                )

                // 未登录访问受保护接口时，返回 401 JSON
                .exceptionHandling(exception -> exception//配置异常处理相关的策略
                        // 未登录访问受保护接口时，返回 401 JSON
                        .authenticationEntryPoint((request, response, e) -> {
                            response.setStatus(
                                    HttpServletResponse.SC_UNAUTHORIZED// 401 未授权
                            );
                        })
                )

                // 把你写的 JWT 过滤器加入安全过滤器链
                .addFilterBefore(
                        new JwtFilter(jwtUtil),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}