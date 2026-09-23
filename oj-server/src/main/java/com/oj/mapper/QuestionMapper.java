package com.oj.mapper;

import com.github.pagehelper.Page;
import com.oj.dto.QuestionPageQueryDTO;
import com.oj.entity.Question;
import com.oj.vo.AdminQuestionTitleVO;
import com.oj.vo.QuestionDetailVO;
import com.oj.vo.QuestionTitleVO;
import com.oj.vo.QuestionVO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper {
    Page<AdminQuestionTitleVO> pageQuery(QuestionPageQueryDTO questionPageQueryDTO);

    void addQuestion(Question question);

    void deleteQuestion(int id);

    QuestionVO getById(int id);

    void updateQuestion(Question question);

    Page<QuestionTitleVO> userPageQuery(QuestionPageQueryDTO questionPageQueryDTO);

    QuestionDetailVO userGetById(int id);
}
