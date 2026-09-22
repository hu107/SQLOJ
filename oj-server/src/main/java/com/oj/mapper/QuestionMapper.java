package com.oj.mapper;

import com.github.pagehelper.Page;
import com.oj.dto.QuestionPageQueryDTO;
import com.oj.entity.Question;
import com.oj.vo.AdminQuestionVO;
import com.oj.vo.QuestionVO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper {
    Page<AdminQuestionVO> pageQuery(QuestionPageQueryDTO questionPageQueryDTO);

    void addQuestion(Question question);

    void deleteQuestion(int id);

    QuestionVO getById(int id);

    void updateQuestion(Question question);
}
