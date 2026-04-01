CREATE TABLE trios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  account_user_id UUID REFERENCES users(id),
  designer_user_id UUID REFERENCES users(id),
  gt_user_id UUID REFERENCES users(id),
  tech_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trios_account ON trios(account_user_id);
CREATE INDEX idx_trios_designer ON trios(designer_user_id);
CREATE INDEX idx_trios_gt ON trios(gt_user_id);
