import json
from src.core.shared.models import (
    InitialValueVariable,
    UniformVariable,
    NormalVariable,
    CategoricalVariable,
    DerivedVariable,
    Category,
    NumberAction,
    OptionAction,
    TextAction
)

class ConfigEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (InitialValueVariable, UniformVariable, NormalVariable, 
                          CategoricalVariable, DerivedVariable, Category,
                          NumberAction, OptionAction, TextAction)):
            obj_dict = obj.__dict__.copy()
            obj_dict['__class__'] = obj.__class__.__name__
            return obj_dict
        return super().default(obj)

def _decode_config(json_dict):
    if '__class__' in json_dict:
        class_name = json_dict.pop('__class__')
        class_map = {
            'InitialValueVariable': InitialValueVariable,
            'UniformVariable': UniformVariable,
            'NormalVariable': NormalVariable,
            'CategoricalVariable': CategoricalVariable,
            'DerivedVariable': DerivedVariable,
            'Category': Category,
            'NumberAction': NumberAction,
            'OptionAction': OptionAction,
            'TextAction': TextAction
        }
        
        if class_name in class_map:
            return class_map[class_name](**json_dict)
    return json_dict


def decode_config(config):
    """
    Decode a config.
    
    Args:
        config: The configuration object to decode
        
    Returns:
        The decoded config
    """
    
    return json.loads(json.dumps(config), object_hook=_decode_config)

def encode_config(config):
    """
    Encode a config.
    
    Args:
        config: The configuration object to encode
        
    Returns:
        The encoded config
    """
    return json.loads(json.dumps(config, cls=ConfigEncoder))
