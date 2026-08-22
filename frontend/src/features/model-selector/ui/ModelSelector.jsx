import { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../model/models';

export const ModelSelector = ({ selectedModelId, onSelectModel, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const IconComponent = currentModel.icon || Sparkles;

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="model-selector-wrapper" ref={dropdownRef}>
      <button 
        type="button"
        className={`model-selector-button ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="model-selector-badge" style={{ backgroundColor: `${currentModel.badgeColor}22`, color: currentModel.badgeColor }}>
          <IconComponent size={14} />
          <span>{currentModel.badge}</span>
        </div>
        <span className="model-selector-name">{currentModel.name}</span>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="model-dropdown-menu" role="listbox">
          <div className="model-dropdown-header">
            <span>LLM 모델 선택 (LangChain 다중 벤더)</span>
          </div>
          <div className="model-dropdown-list">
            {AVAILABLE_MODELS.map((item) => {
              const ItemIcon = item.icon || Sparkles;
              const isSelected = item.id === currentModel.id;
              return (
                <div
                  key={item.id}
                  className={`model-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectModel(item);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="model-item-icon-wrapper" style={{ color: item.badgeColor, backgroundColor: `${item.badgeColor}18` }}>
                    <ItemIcon size={18} />
                  </div>
                  <div className="model-item-info">
                    <div className="model-item-title-row">
                      <span className="model-item-name">{item.name}</span>
                      <span className="model-item-badge" style={{ borderColor: `${item.badgeColor}44`, color: item.badgeColor }}>
                        {item.badge}
                      </span>
                    </div>
                    <span className="model-item-desc">{item.description}</span>
                  </div>
                  {isSelected && (
                    <div className="model-item-check">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
