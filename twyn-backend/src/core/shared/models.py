from typing import Literal
from pydantic import BaseModel, Field, create_model, model_validator


class InitialValueVariable(BaseModel):
    """Initializes a variable with a fixed value"""
    value: float | int | str | bool = Field(
        ..., 
        description="The fixed initial value to assign to this variable"
    )

class UniformVariable(BaseModel):
    """Initializes a variable with a value drawn from a uniform distribution"""
    min: float | int = Field(
        ..., 
        description="The minimum value (inclusive) in the uniform distribution range"
    )
    max: float | int = Field(
        ..., 
        description="The maximum value (inclusive) in the uniform distribution range"
    )

class NormalVariable(BaseModel):
    """Initializes a variable with a value drawn from a normal (Gaussian) distribution"""
    mean: float | int = Field(
        ..., 
        description="The mean (average) value of the normal distribution"
    )
    std: float | int = Field(
        ..., 
        description="The standard deviation controlling the spread of the normal distribution"
    )
    
class Category(BaseModel):
    """Defines a category option with its selection probability"""
    value: float | int | str | bool = Field(
        ..., 
        description="The value to assign if this category is selected"
    )
    probability: float | int = Field(
        ..., 
        description="The relative probability (0-100) of this category being selected"
    )

class CategoricalVariable(BaseModel):
    """Initializes a variable by selecting from categories with specified probabilities"""
    categories: list[Category] = Field(
        ..., 
        description="List of possible categories with their selection probabilities"
    )

    @model_validator(mode='after')
    def validate_categories(self):
        total_probability = sum(category.probability for category in self.categories)
        if total_probability != 100:
            raise ValueError(f"The sum of probabilities must be 100, but got {total_probability}")
        return self

class DerivedVariable(BaseModel):
    """Initializes a variable based on other variables using a Python expression"""
    derivation_rule: str = Field(
        ..., 
        description="Python expression that calculates the initial value based on other variables"
    )


class OptionAction(BaseModel):
    """Discrete choice action"""
    options: list[str | int | float | bool] = Field(..., description="List of options for the action")

class NumberAction(BaseModel):
    """Continuous range action"""
    min_value: float | int | None = Field(None, description="Minimum value for the action")
    max_value: float | int | None = Field(None, description="Maximum value for the action")

class TextAction(BaseModel):
    """Free text action"""
    min_words: int | None = Field(None, description="Minimum number of words for the text")
    max_words: int | None = Field(None, description="Maximum number of words for the text")


def create_response_model(actions: dict[str, any]) -> type[BaseModel]:
    """
    Creates a Pydantic action model based on the provided actions configuration.

    Args:
        actions: Dictionary of action configurations with name as key and config as value

    Returns:
        A Pydantic model class with fields based on the actions
    """
    action_models = {}

    for action_name, action in actions.items():
        if isinstance(action["args"], OptionAction):
            options = action["args"].options
            value_type = Literal[tuple(options)]
            value = (value_type, Field(..., description=f"Value for the action"))
            
            validator_func = None
            
        elif isinstance(action["args"], NumberAction):
            min_value = action["args"].min_value
            max_value = action["args"].max_value
            
            value_type = float
            if (isinstance(min_value, int) or min_value is None) and \
            (isinstance(max_value, int) or max_value is None) and \
            (isinstance(min_value, int) or isinstance(max_value, int)):
                value_type = int

            if min_value is not None and max_value is not None:
                value = (value_type, Field(..., description=f"Value for the action", min_value=min_value, max_value=max_value))
            elif min_value is not None:
                value = (value_type, Field(..., description=f"Value for the action", min_value=min_value))
            elif max_value is not None:
                value = (value_type, Field(..., description=f"Value for the action", max_value=max_value))
            else:
                value = (value_type, Field(..., description=f"Value for the action"))
            
            def validate_number(min_value, max_value):
                @model_validator(mode='after')
                def validator(self):
                    if min_value is not None and max_value is not None and (self.value < min_value or self.value > max_value):
                        raise ValueError(f"Value must be between {min_value} and {max_value}, but got {self.value}")
                    elif min_value is not None and self.value < min_value:
                        raise ValueError(f"Value must be greater than {min_value}, but got {self.value}")
                    elif max_value is not None and self.value > max_value:
                        raise ValueError(f"Value must be less than {max_value}, but got {self.value}")
                    return self
                return validator
            
            validator_func = validate_number(min_value, max_value)
            
        elif isinstance(action["args"], TextAction):
            min_words = action["args"].min_words
            max_words = action["args"].max_words
            value_type = str
            value = (value_type, Field(..., description=f"Value for the action", min_words=min_words, max_words=max_words))
            
            def validate_text(min_words, max_words):
                @model_validator(mode='after')
                def validator(self):
                    word_count = len(self.value.split())
                    if min_words is not None and max_words is not None and (word_count < min_words or word_count > max_words):
                        raise ValueError(f"Value must be between {min_words} and {max_words} words, but got {word_count} words")
                    elif min_words is not None and word_count < min_words:
                        raise ValueError(f"Value must be at least {min_words} words, but got {word_count} words")
                    elif max_words is not None and word_count > max_words:
                        raise ValueError(f"Value must be at most {max_words} words, but got {word_count} words")
                    return self
                return validator
            
            validator_func = validate_text(min_words, max_words)
        
        action_model = create_model(
            action_name,
            __doc__=action['description'],
            value=value,
            __validators__={"validate_value": validator_func} if validator_func else None,
        )
        
        action_models[action_name] = action_model
        
    response_fields = {
        "thought": (str, Field(..., description="Thought process for the actions"))
    }
    
    for name, model in action_models.items():
        response_fields[name] = (model, ...)
    
    Response = create_model(
        "Response",
        __doc__="The actions to take and the thought process behind them",
        **response_fields
    )
    
    return Response
