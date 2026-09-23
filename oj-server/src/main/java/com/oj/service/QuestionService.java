package com.oj.service;

import com.oj.dto.QuestionDTO;
import com.oj.dto.QuestionPageQueryDTO;
import com.oj.result.PageResult;
import com.oj.vo.QuestionDetailVO;
import com.oj.vo.QuestionTitleVO;
import com.oj.vo.QuestionVO;
import jakarta.validation.Valid;


public interface QuestionService {
    PageResult pageQuery(QuestionPageQueryDTO questionPageQueryDTO);

    void addQuestion(QuestionDTO questionDTO);

    void deleteQuestion(int id);

    QuestionVO getById(int id);

    void updateQuestion(QuestionDTO questionDTO);

    PageResult usePageQuery(@Valid QuestionPageQueryDTO questionPageQueryDTO);

    QuestionDetailVO userGetById(int id);
}
